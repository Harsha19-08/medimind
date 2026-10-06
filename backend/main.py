"""
MediMind backend
=================
FastAPI + MongoDB. Reads a prescription/bill photo (OpenRouter free vision
model by default), works out the run-out date, and drives an in-process
APScheduler that texts the family — through an Android SMS Gateway phone on
the LAN — twice a day once a medicine is overdue, until a fresh bill resets
the cycle.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""
import asyncio
import json
import os
from contextlib import closing
from datetime import date, datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from bson import ObjectId
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from dotenv import load_dotenv

load_dotenv()
from ai_extract import ExtractionError, extract_medicines_from_image
from csv_sync import sync_recipients_from_csv
from db import get_db, init_indexes
from sms import SmsSendError, send_sms



BASE_DIR = Path(__file__).resolve().parent
TIMEZONE = os.environ.get("TIMEZONE", "Asia/Kolkata")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
PATIENT_NAME = os.environ.get("PATIENT_NAME", "").strip()

app = FastAPI(title="MediMind")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
scheduler = BackgroundScheduler(timezone=TIMEZONE)

MORNING_TEMPLATES = {
    "patient": "Hi {name}, your {medicine_name} is due for refill. Please let us know if you need it. We will take care of it.",
    "family": "Hi {name}, {patient_ref}{medicine_name} is due for refill. Please let us know if you need it. We will take care of it.",
}
EVENING_TEMPLATES = {
    "patient": "Hi {name}, just checking on your {medicine_name}. It still needs a refill. Please don't wait until it runs out.",
    "family": "Hi {name}, just checking on {patient_ref}{medicine_name}. It still needs a refill. Please don't wait until it runs out.",
}


def oid(v) -> ObjectId:
    try:
        return ObjectId(v)
    except Exception:
        raise HTTPException(400, "invalid id")


def ser(doc: dict) -> dict:
    """Make a Mongo document JSON-safe (stringify ObjectIds)."""
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


# ---------------------------------------------------------------------------
# Startup / recovery — scheduler + state are always derived fresh from
# Mongo, so a server restart or the browser never closing never loses state.
# ---------------------------------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_indexes()
    sync_recipients_from_csv()
    rebuild_schedule()
    scheduler.start()


@app.on_event("shutdown")
def on_shutdown():
    scheduler.shutdown(wait=False)


def rebuild_schedule():
    for job in list(scheduler.get_jobs()):
        job.remove()

    db = get_db()
    times = set()
    for m in db.members.find({}, {"morning_time": 1, "evening_time": 1}):
        times.add(m.get("morning_time", "09:00"))
        times.add(m.get("evening_time", "19:00"))
    if not times:
        times = {"09:00", "19:00"}

    for t in times:
        hour, minute = t.split(":")
        slot = "morning" if int(hour) < 12 else "evening"
        scheduler.add_job(
            send_reminders_for_slot,
            CronTrigger(hour=int(hour), minute=int(minute), timezone=TIMEZONE),
            args=[slot, t],
            id=f"reminder_{t.replace(':', '')}",
            replace_existing=True,
        )


# ---------------------------------------------------------------------------
# Reminder math + messaging
# ---------------------------------------------------------------------------

def compute_depletion(quantity: int, dosage_per_day: float, purchase_date: str | None):
    p_date = date.fromisoformat(purchase_date) if purchase_date else date.today()
    dosage_per_day = dosage_per_day or 1
    days_supply = int(quantity // dosage_per_day) if dosage_per_day > 0 else quantity
    depletion = p_date + timedelta(days=days_supply)
    return p_date.isoformat(), depletion.isoformat()


def build_message(slot: str, member: dict, medicine_names: str) -> str:
    templates = MORNING_TEMPLATES if slot == "morning" else EVENING_TEMPLATES
    relation = member.get("relation") if member.get("relation") in ("patient", "family") else "family"
    patient_ref = f"{PATIENT_NAME}'s " if PATIENT_NAME else "their "
    return templates[relation].format(name=member["name"], medicine_name=medicine_names, patient_ref=patient_ref)


def send_reminders_for_slot(slot: str, trigger_time: str | None = None):
    today = date.today().isoformat()
    db = get_db()
    results = []

    for fam in db.families.find({}):
        overdue_meds = list(db.medicines.find(
            {"family_id": fam["_id"], "active": True, "depletion_date": {"$lt": today}}
        ))
        if not overdue_meds:
            continue
        medicine_names = ", ".join(m["name"] for m in overdue_meds)

        query = {"family_id": fam["_id"]}
        if trigger_time:
            time_field = "morning_time" if slot == "morning" else "evening_time"
            query[time_field] = trigger_time
        members = list(db.members.find(query))

        for member in members:
            already = db.reminder_log.find_one(
                {"phone": member["phone"], "slot": slot, "log_date": today, "status": "sent"}
            )
            if already:
                continue

            message = build_message(slot, member, medicine_names)
            status, error = "sent", None
            try:
                send_sms(member["phone"], message)
            except SmsSendError as e:
                status, error = "error", str(e)

            try:
                db.reminder_log.insert_one({
                    "family_id": fam["_id"], "phone": member["phone"], "recipient_name": member["name"],
                    "slot": slot, "log_date": today, "sent_at": datetime.now().isoformat(),
                    "message": message, "status": status, "error": error,
                })
            except Exception:
                pass  # unique index caught a race — another trigger already logged "sent" for this slot/day
            results.append({"phone": member["phone"], "name": member["name"], "status": status, "error": error})

    return results


# ---------------------------------------------------------------------------
# API: recipients
# ---------------------------------------------------------------------------

@app.post("/reload-recipients")
def reload_recipients():
    count = sync_recipients_from_csv()
    rebuild_schedule()
    return {"recipients_loaded": count}


@app.get("/families")
def list_families():
    return [ser(f) for f in get_db().families.find({})]


@app.get("/families/{family_id}/members")
def list_members(family_id: str):
    return [ser(m) for m in get_db().members.find({"family_id": oid(family_id)})]


# ---------------------------------------------------------------------------
# API: slip upload — AI extraction, resets the cycle
# ---------------------------------------------------------------------------

@app.post("/families/{family_id}/upload-slip")
async def upload_slip(family_id: str, file: UploadFile = File(...)):
    db = get_db()
    fam = db.families.find_one({"_id": oid(family_id)})
    if not fam:
        raise HTTPException(404, "Family not found")

    image_bytes = await file.read()
    media_type = file.content_type or "image/jpeg"
    try:
        medicines = extract_medicines_from_image(image_bytes, media_type)
    except ExtractionError as e:
        raise HTTPException(502, str(e))
    if not medicines:
        raise HTTPException(422, "Couldn't read any medicines off that slip — try a clearer photo")

    db.medicines.update_many({"family_id": fam["_id"], "active": True}, {"$set": {"active": False}})

    inserted = []
    for med in medicines:
        purchase_date, depletion_date = compute_depletion(
            int(med["quantity"]), float(med.get("dosage_per_day") or 1), med.get("purchase_date")
        )
        db.medicines.insert_one({
            "family_id": fam["_id"], "name": med["name"], "quantity": int(med["quantity"]),
            "dosage_per_day": float(med.get("dosage_per_day") or 1),
            "purchase_date": purchase_date, "depletion_date": depletion_date, "active": True,
        })
        inserted.append({**med, "purchase_date": purchase_date, "depletion_date": depletion_date})

    return {"family_id": family_id, "medicines": inserted, "status": "cycle reset — reminders stopped until run-out date"}


# ---------------------------------------------------------------------------
# API: status
# ---------------------------------------------------------------------------

def _status_payload(family_id_str: str) -> dict:
    db = get_db()
    family_id = oid(family_id_str)
    today = date.today()

    meds = list(db.medicines.find({"family_id": family_id, "active": True}))
    members = list(db.members.find({"family_id": family_id}))
    last_log = db.reminder_log.find_one({"family_id": family_id}, sort=[("_id", -1)])
    recent_logs = list(db.reminder_log.find({"family_id": family_id}, sort=[("_id", -1)], limit=20))

    med_list, overdue_any, min_days = [], False, None
    for m in meds:
        depletion = date.fromisoformat(m["depletion_date"])
        days_diff = (depletion - today).days
        overdue = days_diff < 0
        overdue_any = overdue_any or overdue
        if min_days is None or days_diff < min_days:
            min_days = days_diff
        med_list.append({**ser(m), "overdue": overdue, "days_remaining": days_diff})

    next_reminder = None
    if overdue_any:
        now = datetime.now()
        candidates = []
        for m in members:
            for t in (m.get("morning_time", "09:00"), m.get("evening_time", "19:00")):
                hour, minute = map(int, t.split(":"))
                candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if candidate <= now:
                    candidate += timedelta(days=1)
                candidates.append(candidate)
        if candidates:
            next_reminder = min(candidates).isoformat()

    return {
        "family_id": family_id_str,
        "members": [ser(m) for m in members],
        "medicines": med_list,
        "status": "active" if overdue_any else "paused",
        "next_reminder_at": next_reminder,
        "days_remaining": min_days,
        "last_sms": ser(last_log) if last_log else None,
        "recent_logs": [ser(r) for r in recent_logs],
    }


@app.get("/families/{family_id}/status")
def family_status(family_id: str):
    return _status_payload(family_id)


@app.get("/families/{family_id}/events")
async def family_events(family_id: str):
    """Server-Sent Events: pushes the status payload every 5s. Purely an
    optional low-latency layer — the dashboard also polls this same
    /status endpoint on an interval, so nothing breaks if SSE is blocked by
    a proxy/firewall."""
    async def gen():
        last_payload = None
        while True:
            try:
                payload = _status_payload(family_id)
            except HTTPException:
                break
            encoded = json.dumps(payload)
            if encoded != last_payload:
                yield f"data: {encoded}\n\n"
                last_payload = encoded
            else:
                yield ": keep-alive\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(gen(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# API: manual test SMS + sweep
# ---------------------------------------------------------------------------

@app.post("/test-sms")
def test_sms(phone: str = Form(...), message: str = Form("This is a test reminder from MediMind.")):
    from csv_sync import normalize_phone
    phone = normalize_phone(phone)
    try:
        send_sms(phone, message)
        return {"ok": True, "phone": phone}
    except SmsSendError as e:
        raise HTTPException(502, f"Send failed: {e}")


@app.post("/families/{family_id}/run-sweep-now")
def run_sweep_now(family_id: str):
    morning = send_reminders_for_slot("morning", trigger_time=None)
    evening = send_reminders_for_slot("evening", trigger_time=None)
    return {"morning": morning, "evening": evening}


@app.get("/health")
def health():
    try:
        get_db().command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"ok": True, "mongo": mongo_ok, "scheduler_running": scheduler.running}
