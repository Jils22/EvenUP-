from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..core.auth import get_current_user
from ..db.deps import get_db
from ..schemas.budgets import BudgetCreate, BudgetOut, BudgetUpdate
from ..utils.mongo_ids import oid, sid
from datetime import datetime, timezone

router = APIRouter(prefix="/budgets", tags=["budgets"])

def budget_to_out(doc: dict) -> BudgetOut:
    return BudgetOut(
        id=sid(doc["_id"]),
        user_id=sid(doc["user_id"]),
        category=doc["category"],
        limit=float(doc["limit"]),
        period=doc["period"],
        color=doc.get("color", "#C08FF5")
    )

@router.get("", response_model=List[BudgetOut])
def list_budgets(db=Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    docs = list(db["budgets"].find({"user_id": me_oid}))
    return [budget_to_out(d) for d in docs]

@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    
    # Check if budget for this category already exists
    existing = db["budgets"].find_one({"user_id": me_oid, "category": payload.category})
    if existing:
        raise HTTPException(status_code=400, detail=f"Budget for category '{payload.category}' already exists")
    
    doc = {
        "user_id": me_oid,
        "category": payload.category.lower(),
        "limit": payload.limit,
        "period": payload.period,
        "color": payload.color,
        "created_at": datetime.now(timezone.utc)
    }
    result = db["budgets"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return budget_to_out(doc)

@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: str, payload: BudgetUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    b_oid = oid(budget_id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data:
        update_data["category"] = update_data["category"].lower()
        
    res = db["budgets"].update_one(
        {"_id": b_oid, "user_id": me_oid},
        {"$set": update_data}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    updated = db["budgets"].find_one({"_id": b_oid})
    return budget_to_out(updated)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    b_oid = oid(budget_id)
    res = db["budgets"].delete_one({"_id": b_oid, "user_id": me_oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return None
