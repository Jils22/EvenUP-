from pymongo.database import Database

from app.db.mongo import get_database


def get_db() -> Database:
    return get_database()