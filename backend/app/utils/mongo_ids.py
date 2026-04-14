from typing import Any
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

def oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid id")


def sid(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def sid_or_none(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)