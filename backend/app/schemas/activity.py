from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ActivityItemOut(BaseModel):
    id: str
    created_at: str
    actor_id: str
    event_type: Optional[str] = None
    verb: Optional[str] = None
    target_id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class ActivityListOut(BaseModel):
    items: List[ActivityItemOut] = Field(default_factory=list)