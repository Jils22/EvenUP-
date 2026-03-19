from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def log_audit(
    db,
    *,
    group_id: ObjectId,
    actor_id: ObjectId,
    action: str,
    target_type: str,
    target_id: ObjectId,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
):
    db["audit_logs"].insert_one(
        {
            "group_id": group_id,
            "actor_id": actor_id,
            "action": action,
            "target": {"type": target_type, "id": target_id},
            "before": before,
            "after": after,
            "created_at": datetime.now(timezone.utc),
        }
    )