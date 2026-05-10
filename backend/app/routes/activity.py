from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..schemas.activity import ActivityItemOut, ActivityListOut
from ..services.common_service import require_group_member
from ..utils.mongo_ids import oid, sid_or_none, sid

router = APIRouter(prefix="/groups/{group_id}", tags=["activity"])


def to_iso_datetime(value, fallback_id=None) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()

    if isinstance(value, str) and value.strip():
        return value.strip()

    if fallback_id is not None:
        return fallback_id.generation_time.isoformat()

    return datetime.now(timezone.utc).isoformat()


@router.get("/activity", response_model=ActivityListOut)
def activity(
    group_id: str,
    limit: int = 50,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not 1 <= limit <= 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")

    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    rows = list(
        db["activity"]
        .find({"group_id": group_oid})
        .sort([("created_at", -1), ("_id", -1)])
        .limit(limit)
    )

    items = [
        ActivityItemOut(
            id=sid(row["_id"]),
            created_at=to_iso_datetime(row.get("created_at"), row["_id"]),
            actor_id=sid(row["actor_id"]),
            event_type=row.get("event_type"),
            verb=row.get("verb"),
            target_id=sid_or_none(row.get("target_id")),
            data=row.get("data", {}),
        )
        for row in rows
    ]

    return ActivityListOut(items=items)