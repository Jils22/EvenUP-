from pydantic import BaseModel, Field
from typing import Optional, Literal

class BudgetBase(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    limit: float = Field(gt=0, description="Spending limit in rupees")
    period: Literal["monthly", "weekly"] = "monthly"
    color: Optional[str] = "#C08FF5"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    limit: Optional[float] = None
    period: Optional[Literal["monthly", "weekly"]] = None
    color: Optional[str] = None

class BudgetOut(BudgetBase):
    id: str
    user_id: str
