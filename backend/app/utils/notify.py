from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional
from bson import ObjectId


def notify_users(
    db,
    *,
    user_ids: Iterable[ObjectId],
    notif_type: str,
    data: Dict[str, Any],
    group_id: Optional[ObjectId] = None,
):
    now = datetime.now(timezone.utc)
    docs = []
    for uid in set(user_ids):
        docs.append(
            {
                "user_id": uid,
                "group_id": group_id,
                "type": notif_type,
                "data": data,
                "is_read": False,
                "created_at": now,
            }
        )
    if docs:
        db["notifications"].insert_many(docs)