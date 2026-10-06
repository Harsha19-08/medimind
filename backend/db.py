"""Mongo connection + collection handles, in one place."""
import os
from pymongo import MongoClient, ASCENDING

MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://mharshavardhan165_db_user:94ohPLpbbya0caKC@cluster0.hkwm8ci.mongodb.net/?appName=Cluster0")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "medimind")

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    return _client


def get_db():
    return get_client()[MONGO_DB_NAME]


def init_indexes():
    db = get_db()
    db.members.create_index([("family_id", ASCENDING), ("phone", ASCENDING)], unique=True)
    db.medicines.create_index([("family_id", ASCENDING), ("active", ASCENDING)])
    db.reminder_log.create_index(
        [("phone", ASCENDING), ("slot", ASCENDING), ("log_date", ASCENDING)],
        unique=True,
        partialFilterExpression={"status": "sent"},
        name="ux_reminder_once",
    )
