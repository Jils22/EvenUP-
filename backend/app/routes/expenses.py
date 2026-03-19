from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Response, status

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.expenses import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.services.common_service import require_expense_in_group, require_group_member
from app.services.expense_service import (
    create_expense_service,
    delete_expense_service,
    expense_to_out,
    update_expense_service,
)
from app.utils.mongo_ids import oid

router = APIRouter(prefix="/groups/{group_id}", tags=["expenses"])


@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(group_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    docs = list(db["expenses"].find({"group_id": group_oid}).sort([("_id", -1)]))
    return [expense_to_out(e) for e in docs]


@router.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(group_id: str, expense_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = require_expense_in_group(db, group_oid, expense_oid)
    return expense_to_out(expense)


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(group_id: str, payload: ExpenseCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return create_expense_service(db, group_id, current_user, payload)


@router.patch("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(group_id: str, expense_id: str, payload: ExpenseUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return update_expense_service(db, group_id, expense_id, current_user, payload)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(group_id: str, expense_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    delete_expense_service(db, group_id, expense_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)