"""SMS sending via the open-source 'SMS Gateway for Android' app (Local
Server mode) running on a phone on the same network. No paid SMS API.

Includes timeout + bounded retry with backoff for transient gateway/network
failures (phone asleep, WiFi blip, gateway app restarting).
"""
import os
import time

import httpx

SMS_PROVIDER = os.environ.get("SMS_PROVIDER", "android_gateway")  # android_gateway | console
SMS_GATEWAY_URL = os.environ.get("SMS_GATEWAY_URL", "http://192.168.1.8:8080")
SMS_GATEWAY_USERNAME = os.environ.get("SMS_GATEWAY_USERNAME", "sms")
SMS_GATEWAY_PASSWORD = os.environ.get("SMS_GATEWAY_PASSWORD", "")

MAX_ATTEMPTS = 3
BACKOFF_SECONDS = 2  # doubles each retry: 2s, 4s


class SmsSendError(Exception):
    pass


def _send_once(phone: str, message: str) -> None:
    if SMS_PROVIDER == "console":
        print(f"[SMS -> {phone}] {message}")
        return

    if SMS_PROVIDER == "android_gateway":
        url = SMS_GATEWAY_URL.rstrip("/") + "/messages"
        payload = {"phoneNumbers": [phone], "textMessage": {"text": message}}
        with httpx.Client(timeout=12) as c:
            r = c.post(url, json=payload, auth=(SMS_GATEWAY_USERNAME, SMS_GATEWAY_PASSWORD))
        if not r.is_success:
            raise SmsSendError(f"gateway responded {r.status_code}: {r.text[:200]}")
        return

    raise SmsSendError(f"Unknown SMS_PROVIDER: {SMS_PROVIDER}")


def send_sms(phone: str, message: str) -> None:
    """Retries transient failures (network errors, 5xx, timeouts). A 4xx
    from the gateway (bad auth, malformed number) is not retried — it won't
    succeed on attempt 2 either."""
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            _send_once(phone, message)
            return
        except httpx.TimeoutException as e:
            last_error = e
        except httpx.RequestError as e:
            last_error = e
        except SmsSendError as e:
            msg = str(e)
            if "responded 4" in msg:
                raise  # permanent-looking failure, don't burn retries
            last_error = e

        if attempt < MAX_ATTEMPTS:
            time.sleep(BACKOFF_SECONDS * attempt)

    raise SmsSendError(f"failed after {MAX_ATTEMPTS} attempts: {last_error}")
