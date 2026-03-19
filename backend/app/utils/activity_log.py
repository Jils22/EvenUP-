from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def log_activity(
    db,
    *,
    group_id: ObjectId,
    actor_id: ObjectId,
    event_type: str,          # "expense" | "settlement" | "comment" | ...
    verb: str,                # "created" | "updated" | "deleted"
    target_id: ObjectId,
    data: Dict[str, Any],
):
    db["activity"].insert_one(
        {
            "group_id": group_id,
            "actor_id": actor_id,
            "event_type": event_type,
            "verb": verb,
            "target_id": target_id,
            "data": data,
            "created_at": datetime.now(timezone.utc),
        }
    )