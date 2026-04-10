from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class ExactSplitIn(BaseModel):
    user_id: str
    amount: float = Field(ge=0)


class PercentSplitIn(BaseModel):
    user_id: str
    percent: float = Field(ge=0, le=100)


class SplitOut(BaseModel):
    user_id: str
    share_minor: int


# ── Consensus / Approval types ──────────────────────────────────────────────

class VoteOut(BaseModel):
    user_id: str
    vote: Literal["approved", "rejected"]
    voted_at: datetime


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    paid_by_user_id: str

    split_type: Literal["equal", "exact", "percent"] = "equal"

    participant_user_ids: List[str] = Field(default_factory=list)
    splits: Optional[List[ExactSplitIn]] = None
    percents: Optional[List[PercentSplitIn]] = None
    category: Optional[str] = None


class ExpenseOut(BaseModel):
    id: str
    group_id: str
    title: str
    amount_minor: int
    paid_by: str
    split_type: Literal["equal", "exact", "percent"]
    splits: List[SplitOut] = Field(default_factory=list)
    category: Optional[str] = None
    # Consensus fields — defaults keep old documents backward-compatible
    status: str = "approved"
    approvals: List[VoteOut] = Field(default_factory=list)
    required_approvals: int = 0
    expires_at: Optional[datetime] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    amount: Optional[float] = Field(default=None, gt=0)
    split_type: Optional[Literal["equal", "exact", "percent"]] = None

    participant_user_ids: Optional[List[str]] = None
    splits: Optional[List[ExactSplitIn]] = None
    percents: Optional[List[PercentSplitIn]] = None
    category: Optional[str] = None