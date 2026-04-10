"""
approvals.py — Consensus-based expense verification
=====================================================
Blockchain-inspired voting layer for EvenUP expenses.

Rules (as confirmed by product owner):
  • Unanimous approval required — ALL non-creator members must vote "approved".
  • A single "rejected" vote immediately flags the expense as rejected.
  • Creator is notified on EVERY vote (approve or reject).
  • Rejected expenses stay in the DB (status="rejected") for audit history.
  • Pending expenses expire after 48 h and are auto-rejected on next access.
  • Creator can withdraw (soft-delete to status="withdrawn") a pending expense.
  • Editing a pending expense resets all votes and restarts the 48-h clock.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.expenses import ExpenseOut
from app.services.common_service import require_expense_in_group, require_group_member
from app.services.expense_service import expense_to_out
from app.utils.mongo_ids import oid, sid
from app.utils.notify import notify_users

router = APIRouter(prefix="/groups/{group_id}", tags=["approvals"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _get_pending_expense(db, group_oid: ObjectId, expense_oid: ObjectId) -> dict:
    """Fetch an expense that is currently pending. Auto-expires stale ones."""
    expense = require_expense_in_group(db, group_oid, expense_oid)

    if expense.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Expense is not pending approval.")

    # Auto-expire if 48-h window has passed
    expires_at = expense.get("expires_at")
    if expires_at:
        aware = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > aware:
            db["expenses"].update_one(
                {"_id": expense_oid},
                {"$set": {"status": "rejected", "rejection_reason": "expired"}},
            )
            notify_users(
                db,
                user_ids=[expense["paid_by"]],
                notif_type="expense_expired",
                group_id=group_oid,
                data={
                    "expense_id": sid(expense_oid),
                    "title": expense["title"],
                    "amount_minor": int(expense["amount_minor"]),
                },
            )
            raise HTTPException(status_code=410, detail="Expense approval window expired. It has been auto-rejected.")

    return expense


def _adjust_required_approvals(db, group_oid: ObjectId, expense: dict) -> int:
    """
    Recalculate required_approvals based on current group membership.
    This handles the edge case where a member leaves mid-approval.
    """
    group = db["groups"].find_one({"_id": group_oid})
    current_member_ids: List[ObjectId] = group.get("member_ids", [])
    creator_oid = expense["paid_by"]
    other_members = [m for m in current_member_ids if m != creator_oid]
    return len(other_members)


# ── GET /pending ─────────────────────────────────────────────────────────────

@router.get("/expenses/pending", response_model=List[ExpenseOut])
def list_pending_expenses(
    group_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return all expenses currently awaiting consensus approval in this group.
    Auto-expires any stale documents (>48 h old) before returning.
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

    # Return live pending expenses
    docs = list(
        db["expenses"]
        .find({"group_id": group_oid, "status": "pending"})
        .sort([("_id", -1)])
    )
    return [expense_to_out(e) for e in docs]


# ── POST /approve ─────────────────────────────────────────────────────────────

@router.post(
    "/expenses/{expense_id}/approve",
    response_model=ExpenseOut,
    status_code=status.HTTP_200_OK,
)
def approve_expense(
    group_id: str,
    expense_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cast an 'approved' vote. When all required votes are cast, expense goes live."""
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = _get_pending_expense(db, group_oid, expense_oid)

    # Creator cannot vote on their own expense
    if expense["paid_by"] == me_oid:
        raise HTTPException(status_code=403, detail="You cannot vote on your own expense.")

    # Prevent double-voting
    existing_voters = {a["user_id"] for a in expense.get("approvals", [])}
    if me_oid in existing_voters:
        raise HTTPException(status_code=409, detail="You have already voted on this expense.")

    now = datetime.now(timezone.utc)
    vote_entry = {"user_id": me_oid, "vote": "approved", "voted_at": now}

    # Append vote
    db["expenses"].update_one(
        {"_id": expense_oid},
        {"$push": {"approvals": vote_entry}},
    )

    # Notify creator of this individual vote
    notify_users(
        db,
        user_ids=[expense["paid_by"]],
        notif_type="expense_vote_cast",
        group_id=group_oid,
        data={
            "expense_id": sid(expense_oid),
            "title": expense["title"],
            "voter_id": sid(me_oid),
            "voter_name": current_user.get("name", "A member"),
            "vote": "approved",
        },
    )

    # Re-fetch to get current approval count
    updated = db["expenses"].find_one({"_id": expense_oid})
    approved_votes = [a for a in updated.get("approvals", []) if a["vote"] == "approved"]

    # Recalculate threshold in case a member left the group
    required = _adjust_required_approvals(db, group_oid, updated)

    if len(approved_votes) >= required:
        # ── All required approvals collected → commit to ledger ──
        db["expenses"].update_one(
            {"_id": expense_oid},
            {"$set": {"status": "approved", "required_approvals": required}},
        )
        updated = db["expenses"].find_one({"_id": expense_oid})

        # Notify ALL group members that the expense is now live
        group = db["groups"].find_one({"_id": group_oid})
        all_member_ids = group.get("member_ids", [])
        notify_users(
            db,
            user_ids=all_member_ids,
            notif_type="expense_approved",
            group_id=group_oid,
            data={
                "expense_id": sid(expense_oid),
                "title": updated["title"],
                "amount_minor": int(updated["amount_minor"]),
                "paid_by": sid(updated["paid_by"]),
            },
        )

    return expense_to_out(updated)


# ── POST /reject ──────────────────────────────────────────────────────────────

@router.post(
    "/expenses/{expense_id}/reject",
    response_model=ExpenseOut,
    status_code=status.HTTP_200_OK,
)
def reject_expense(
    group_id: str,
    expense_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cast a 'rejected' vote. Any single rejection immediately flags the expense."""
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = _get_pending_expense(db, group_oid, expense_oid)

    # Creator cannot reject their own expense
    if expense["paid_by"] == me_oid:
        raise HTTPException(status_code=403, detail="You cannot vote on your own expense.")

    # Prevent double-voting
    existing_voters = {a["user_id"] for a in expense.get("approvals", [])}
    if me_oid in existing_voters:
        raise HTTPException(status_code=409, detail="You have already voted on this expense.")

    now = datetime.now(timezone.utc)
    vote_entry = {"user_id": me_oid, "vote": "rejected", "voted_at": now}

    # Append vote + immediately mark rejected
    db["expenses"].update_one(
        {"_id": expense_oid},
        {
            "$push": {"approvals": vote_entry},
            "$set": {
                "status": "rejected",
                "rejection_reason": "member_rejected",
            },
        },
    )

    updated = db["expenses"].find_one({"_id": expense_oid})

    # Notify creator of individual rejection vote
    notify_users(
        db,
        user_ids=[expense["paid_by"]],
        notif_type="expense_vote_cast",
        group_id=group_oid,
        data={
            "expense_id": sid(expense_oid),
            "title": expense["title"],
            "voter_id": sid(me_oid),
            "voter_name": current_user.get("name", "A member"),
            "vote": "rejected",
        },
    )

    # Notify ALL group members that the expense was rejected
    group = db["groups"].find_one({"_id": group_oid})
    all_member_ids = group.get("member_ids", [])
    notify_users(
        db,
        user_ids=all_member_ids,
        notif_type="expense_rejected",
        group_id=group_oid,
        data={
            "expense_id": sid(expense_oid),
            "title": updated["title"],
            "amount_minor": int(updated["amount_minor"]),
            "rejected_by": sid(me_oid),
            "rejector_name": current_user.get("name", "A member"),
        },
    )

    return expense_to_out(updated)


# ── DELETE /pending (withdraw) ────────────────────────────────────────────────

@router.delete(
    "/expenses/{expense_id}/pending",
    response_model=ExpenseOut,
    status_code=status.HTTP_200_OK,
)
def withdraw_expense(
    group_id: str,
    expense_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Creator withdraws a pending expense before consensus is reached.
    Sets status to 'withdrawn'. Data is kept for audit purposes.
    """
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = _get_pending_expense(db, group_oid, expense_oid)

    # Only the creator can withdraw
    if expense["paid_by"] != me_oid:
        raise HTTPException(status_code=403, detail="Only the expense creator can withdraw it.")

    db["expenses"].update_one(
        {"_id": expense_oid},
        {"$set": {"status": "withdrawn"}},
    )
    updated = db["expenses"].find_one({"_id": expense_oid})

    # Notify all other group members
    group = db["groups"].find_one({"_id": group_oid})
    other_members = [m for m in group.get("member_ids", []) if m != me_oid]
    notify_users(
        db,
        user_ids=other_members,
        notif_type="expense_withdrawn",
        group_id=group_oid,
        data={
            "expense_id": sid(expense_oid),
            "title": updated["title"],
            "amount_minor": int(updated["amount_minor"]),
            "withdrawn_by": sid(me_oid),
        },
    )

    return expense_to_out(updated)
