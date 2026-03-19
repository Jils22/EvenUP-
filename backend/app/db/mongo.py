from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.core.config import settings

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_database() -> Database:
    return get_client()[settings.MONGODB_DB]


def ping_database() -> None:
    try:
        get_client().admin.command("ping")
    except PyMongoError as exc:
        raise RuntimeError("Could not connect to MongoDB") from exc


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None