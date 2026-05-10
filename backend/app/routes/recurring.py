"""
Recurring expense routes.

Allows groups to define recurring bills (rent, Netflix, etc.) that
generate a reminder notification.  The actual auto-creation of expense
records is done via a lightweight background check on listing, keeping
the architecture simple without requiring a Celery/cron daemon.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..services.common_service import require_group_member
from ..utils.mongo_ids import oid, sid
from ..utils.notify import notify_users

router = APIRouter(prefix="/groups/{group_id}/recurring", tags=["recurring"])

FREQ_DAYS: dict[str, int] = {
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
    "quarterly": 90,
    "yearly": 365,
}


class RecurringCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    paid_by_user_id: str
    frequency: Literal["weekly", "biweekly", "monthly", "quarterly", "yearly"]
    category: Optional[str] = None
    # participant_user_ids for equal split (must include paid_by)
    participant_user_ids: list[str] = Field(min_length=2)
    next_due: Optional[str] = None  # ISO date string; defaults to today


class RecurringUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    amount: Optional[float] = Field(default=None, gt=0)
    frequency: Optional[Literal["weekly", "biweekly", "monthly", "quarterly", "yearly"]] = None
    active: Optional[bool] = None


def _recurring_to_out(group_id: str, doc: dict) -> dict:
    return {
        "id": sid(doc["_id"]),
        "group_id": group_id,
        "title": doc["title"],
        "amount": round(int(doc["amount_minor"]) / 100, 2),
        "paid_by_user_id": sid(doc["paid_by"]),
        "frequency": doc["frequency"],
        "category": doc.get("category"),
        "participant_user_ids": [sid(u) for u in doc.get("participant_user_ids", [])],
        "next_due": doc["next_due"].isoformat() if isinstance(doc.get("next_due"), datetime) else doc.get("next_due"),
        "active": doc.get("active", True),
        "created_at": doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at"),
    }


def _amount_to_minor(amount: float) -> int:
    """Convert decimal currency amount to minor units (e.g. paise)."""
    result = round(amount * 100)
    if result <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return result


@router.post("", status_code=201)
def create_recurring(
    group_id: str,
    payload: RecurringCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    paid_by_oid = oid(payload.paid_by_user_id)
    if paid_by_oid not in group.get("member_ids", []):
        raise HTTPException(status_code=400, detail="paid_by_user_id must be a group member")

    participant_oids = [oid(u) for u in payload.participant_user_ids]
    if paid_by_oid not in participant_oids:
        raise HTTPException(status_code=400, detail="paid_by must be in participant_user_ids")

    for p_oid in participant_oids:
        if p_oid not in group.get("member_ids", []):
            raise HTTPException(status_code=400, detail=f"Participant {sid(p_oid)} is not a group member")

    amount_minor = _amount_to_minor(payload.amount)
    now = datetime.now(timezone.utc)

    if payload.next_due:
        try:
            next_due_dt = datetime.fromisoformat(payload.next_due.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid next_due date format; use ISO 8601")
    else:
        next_due_dt = now

    doc = {
        "group_id": group_oid,
        "title": payload.title,
        "amount_minor": amount_minor,
        "paid_by": paid_by_oid,
        "frequency": payload.frequency,
        "category": payload.category,
        "participant_user_ids": participant_oids,
        "next_due": next_due_dt,
        "active": True,
        "created_by": me_oid,
        "created_at": now,
    }
    result = db["recurring_expenses"].insert_one(doc)
    created = db["recurring_expenses"].find_one({"_id": result.inserted_id})
    return _recurring_to_out(group_id, created)


@router.get("")
def list_recurring(
    group_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    docs = list(db["recurring_expenses"].find({"group_id": group_oid}).sort("_id", -1))
    return [_recurring_to_out(group_id, d) for d in docs]


@router.patch("/{recurring_id}")
def update_recurring(
    group_id: str,
    recurring_id: str,
    payload: RecurringUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    rec_oid = oid(recurring_id)
    doc = db["recurring_expenses"].find_one({"_id": rec_oid, "group_id": group_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    patch = payload.model_dump(exclude_unset=True)
    update: dict = {}
    if "title" in patch:
        update["title"] = patch["title"]
    if "amount" in patch:
        update["amount_minor"] = _amount_to_minor(patch["amount"])
    if "frequency" in patch:
        update["frequency"] = patch["frequency"]
    if "active" in patch:
        update["active"] = patch["active"]

    if not update:
        return _recurring_to_out(group_id, doc)

    db["recurring_expenses"].update_one({"_id": rec_oid}, {"$set": update})
    updated = db["recurring_expenses"].find_one({"_id": rec_oid})
    return _recurring_to_out(group_id, updated)


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring(
    group_id: str,
    recurring_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    rec_oid = oid(recurring_id)
    res = db["recurring_expenses"].delete_one({"_id": rec_oid, "group_id": group_oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
