from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class SettlementCreate(BaseModel):
    from_user_id: str
    to_user_id: str
    amount: float = Field(gt=0)


class SettlementUpdate(BaseModel):
    from_user_id: Optional[str] = None
    to_user_id: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)


class SettlementOut(BaseModel):
    id: str
    group_id: str
    from_user_id: str
    to_user_id: str
    amount_minor: int
    created_at: Optional[str] = None
    created_by: Optional[str] = None
