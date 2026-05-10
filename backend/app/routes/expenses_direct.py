from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from ..core.auth import get_current_user
from ..db.deps import get_db
from ..schemas.expenses import ExpenseOut
from ..services.expense_service import expense_to_out
from ..utils.mongo_ids import oid, sid

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense_direct(expense_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch an expense by ID without needing the group_id prefix."""
    me_oid = oid(current_user["id"])
    expense_oid = oid(expense_id)
    
    expense = db["expenses"].find_one({"_id": expense_oid})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Check if user is a member of the group this expense belongs to
    group_oid = expense["group_id"]
    group = db["groups"].find_one({"_id": group_oid, "member_ids": me_oid})
    if not group:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return expense_to_out(expense)
