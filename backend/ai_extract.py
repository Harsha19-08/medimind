"""Reads a prescription/bill photo and extracts medicines as structured JSON.

Supports two providers, switchable via AI_PROVIDER:
  - "openrouter" (default) — OpenAI-compatible endpoint, free vision models.
    Defaults to "openrouter/free", OpenRouter's own router that auto-picks a
    free model supporting image input — no need to track which specific
    free vision model is currently available.
  - "anthropic" — direct Claude API (the original integration), kept as a
    fallback if you'd rather use a paid Anthropic key.
"""
import base64
import json
import os

import httpx

AI_PROVIDER = os.environ.get("AI_PROVIDER", "openrouter")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openrouter/free")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_SITE_URL = os.environ.get("OPENROUTER_SITE_URL", "http://localhost:3000")
OPENROUTER_APP_NAME = os.environ.get("OPENROUTER_APP_NAME", "MediMind")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.environ.get("EXTRACTION_MODEL", "claude-sonnet-5")

EXTRACTION_PROMPT = """You are reading a photo of a pharmacy bill / medicine prescription slip.

Extract every distinct medicine on it as a JSON array. For each medicine give:
- "name": the medicine name as printed (brand name is fine)
- "quantity": total number of tablets/capsules/units purchased, as an integer
  (if sold in strips, multiply strips x tablets-per-strip to get the total unit count)
- "dosage_per_day": how many units are taken per day, as a number (e.g. 1, 2, 0.5).
  If the slip shows a schedule like "1-0-1" (morning-afternoon-night), sum it (here: 2).
  If dosage isn't stated anywhere on the slip, make your best reasonable estimate
  for that medicine type and set "dosage_assumed": true.
- "purchase_date": the bill/prescription date in YYYY-MM-DD format. If no date is
  visible, use null.

Respond with ONLY a raw JSON array, no markdown fences, no commentary. Example:
[{"name":"Metformin 500mg","quantity":60,"dosage_per_day":2,"purchase_date":"2026-09-01","dosage_assumed":false}]

If you genuinely cannot read any medicine info from the image, respond with: []
"""


class ExtractionError(Exception):
    pass


def _clean_json_text(text: str) -> str:
    text = text.strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return text


def _parse_medicines(text: str) -> list:
    text = _clean_json_text(text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ExtractionError(f"Could not parse AI response as JSON: {text[:300]}") from e
    if not isinstance(data, list):
        raise ExtractionError("AI response was not a JSON array")
    return data


def _extract_via_openrouter(image_bytes: bytes, media_type: str) -> list:
    if not OPENROUTER_API_KEY:
        raise ExtractionError("OPENROUTER_API_KEY not configured on the server")

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{media_type};base64,{b64}"

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": EXTRACTION_PROMPT},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }],
        "max_tokens": 1500,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": OPENROUTER_APP_NAME,
    }

    with httpx.Client(timeout=45) as c:
        r = c.post(OPENROUTER_URL, json=payload, headers=headers)
    if not r.is_success:
        raise ExtractionError(f"OpenRouter error {r.status_code}: {r.text[:300]}")

    body = r.json()
    choices = body.get("choices") or []
    if not choices:
        raise ExtractionError(f"OpenRouter returned no choices: {body}")
    text = choices[0]["message"]["content"]
    return _parse_medicines(text)


def _extract_via_anthropic(image_bytes: bytes, media_type: str) -> list:
    if not ANTHROPIC_API_KEY:
        raise ExtractionError("ANTHROPIC_API_KEY not configured on the server")
    from anthropic import Anthropic

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    resp = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                {"type": "text", "text": EXTRACTION_PROMPT},
            ],
        }],
    )
    text = "".join(block.text for block in resp.content if block.type == "text")
    return _parse_medicines(text)


def extract_medicines_from_image(image_bytes: bytes, media_type: str) -> list:
    if AI_PROVIDER == "anthropic":
        return _extract_via_anthropic(image_bytes, media_type)
    return _extract_via_openrouter(image_bytes, media_type)
