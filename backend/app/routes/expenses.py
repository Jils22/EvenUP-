from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.database import Database

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.expenses import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.services.common_service import require_expense_in_group, require_group_member
from app.services.expense_service import (
    create_expense_service,
    delete_expense_service,
    expense_to_out,
    update_expense_service,
    approve_expense_service,
    reject_expense_service,
    withdraw_expense_service,
)
from app.utils.mongo_ids import oid, sid
from app.utils.notify import notify_users

router = APIRouter(prefix="/groups/{group_id}", tags=["expenses"])


@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(group_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    docs = list(
        db["expenses"]
        .find({
            "group_id": group_oid,
            "$or": [
                {"status": "approved"},
                {"status": {"$exists": False}},
            ],
        })
        .sort([("_id", -1)])
    )
    return [expense_to_out(e) for e in docs]


@router.get("/expenses/pending", response_model=List[ExpenseOut])
def list_pending_expenses(
    group_id: str,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return all expenses currently awaiting consensus approval in this group.
    """
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    now = datetime.now(timezone.utc)

    # Auto-expire stale pending expenses (mark them rejected)
    stale_cursor = db["expenses"].find({
        "group_id": group_oid,
        "status": "pending",
        "expires_at": {"$lt": now},
    })
    for stale in stale_cursor:
        db["expenses"].update_one(
            {"_id": stale["_id"]},
            {"$set": {"status": "rejected", "rejection_reason": "expired"}},
        )
        # (notifications omitted for brevity in summary, but including them in real code)
        notify_users(
            db,
            user_ids=[stale["paid_by"]],
            notif_type="expense_expired",
            group_id=group_oid,
            data={
                "expense_id": sid(stale["_id"]),
                "title": stale["title"],
                "amount_minor": int(stale["amount_minor"]),
            },
        )

    docs = list(
        db["expenses"]
        .find({"group_id": group_oid, "status": "pending"})
        .sort([("_id", -1)])
    )
    return [expense_to_out(e) for e in docs]


@router.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(group_id: str, expense_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = require_expense_in_group(db, group_oid, expense_oid)
    return expense_to_out(expense)


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(group_id: str, payload: ExpenseCreate, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    return create_expense_service(db, group_id, current_user, payload)


@router.patch("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(group_id: str, expense_id: str, payload: ExpenseUpdate, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    return update_expense_service(db, group_id, expense_id, current_user, payload)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(group_id: str, expense_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    delete_expense_service(db, group_id, expense_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/expenses/{expense_id}/approve", response_model=ExpenseOut)
def approve_expense(group_id: str, expense_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    return approve_expense_service(db, group_id, expense_id, current_user)


@router.post("/expenses/{expense_id}/reject", response_model=ExpenseOut)
def reject_expense(group_id: str, expense_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    return reject_expense_service(db, group_id, expense_id, current_user)


@router.delete("/expenses/{expense_id}/pending")
def withdraw_expense(group_id: str, expense_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    return withdraw_expense_service(db, group_id, expense_id, current_user)