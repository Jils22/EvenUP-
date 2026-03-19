from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.notifications import NotificationOut
from app.utils.mongo_ids import oid, sid, sid_or_none

router = APIRouter(tags=["notifications"])


def ensure_datetime(value) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    if isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.strip())
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed
        except ValueError:
            pass

    return datetime.now(timezone.utc)


@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    limit: int = 50,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    limit = max(1, min(limit, 200))

    me_oid = oid(current_user["id"])

    docs = list(
        db["notifications"]
        .find({"user_id": me_oid})
        .sort([("created_at", -1), ("_id", -1)])
        .limit(limit)
    )

    return [
        NotificationOut(
            id=sid(doc["_id"]),
            user_id=sid(doc["user_id"]),
            group_id=sid_or_none(doc.get("group_id")),
            type=doc.get("type", "unknown"),
            data=doc.get("data", {}),
            is_read=bool(doc.get("is_read", False)),
            created_at=ensure_datetime(doc.get("created_at")),
        )
        for doc in docs
    ]