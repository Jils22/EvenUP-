from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    id: str
    user_id: str
    group_id: str | None = None
    type: str
    data: dict[str, Any] = Field(default_factory=dict)
    is_read: bool
    created_at: datetime