"""Loads reminders.csv into Mongo — the only source of recipients, never
hardcoded. Supports either the long format (one row per time slot) or a
wide format (one row per person with explicit morning/evening columns)."""
import csv as csv_module
import os
import re
from datetime import datetime

from db import get_db

CSV_PATH = os.environ.get("REMINDERS_CSV_PATH", "reminders.csv")
PATIENT_NAME = os.environ.get("PATIENT_NAME", "").strip()


def normalize_phone(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("+"):
        return raw
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return "+91" + digits
    return "+" + digits if digits else raw


def parse_time_to_24h(raw: str) -> str:
    raw = raw.strip().upper().replace(".", "")
    for fmt in ("%I:%M %p", "%I %p", "%H:%M"):
        try:
            return datetime.strptime(raw, fmt).strftime("%H:%M")
        except ValueError:
            continue
    return "09:00"


def parse_reminders_csv(path: str) -> dict:
    recipients = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv_module.DictReader(f)
        fields = {c.lower().strip() for c in reader.fieldnames or []}
        wide = "morning_time" in fields or "evening_time" in fields

        for row in reader:
            row = {k.lower().strip(): (v or "").strip() for k, v in row.items()}
            if not row.get("phone"):
                continue
            phone = normalize_phone(row["phone"])
            rec = recipients.setdefault(phone, {
                "name": row["name"],
                "phone": phone,
                "morning_time": "09:00",
                "evening_time": "19:00",
                "relation": row.get("relation") or "family",
            })
            if wide:
                if row.get("morning_time"):
                    rec["morning_time"] = parse_time_to_24h(row["morning_time"])
                if row.get("evening_time"):
                    rec["evening_time"] = parse_time_to_24h(row["evening_time"])
            else:
                t = parse_time_to_24h(row["time"])
                if t < "12:00":
                    rec["morning_time"] = t
                else:
                    rec["evening_time"] = t
    return recipients


def get_or_create_default_family(db) -> str:
    fam = db.families.find_one({})
    if fam:
        return fam["_id"]
    name = PATIENT_NAME or "Primary Family"
    result = db.families.insert_one({"name": name})
    return result.inserted_id


def sync_recipients_from_csv(path: str = CSV_PATH) -> int:
    if not os.path.exists(path):
        return 0
    recipients = parse_reminders_csv(path)
    db = get_db()
    family_id = get_or_create_default_family(db)

    db.members.delete_many({"family_id": family_id, "source": "csv"})
    for r in recipients.values():
        db.members.update_one(
            {"family_id": family_id, "phone": r["phone"]},
            {"$set": {
                "family_id": family_id, "phone": r["phone"], "name": r["name"],
                "morning_time": r["morning_time"], "evening_time": r["evening_time"],
                "relation": r["relation"], "source": "csv",
            }},
            upsert=True,
        )
    return len(recipients)
