from pymongo.database import Database

from .mongo import get_database


def get_db() -> Database:
    return get_database()