from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..schemas.groups import AddMemberRequest, GroupCreate, GroupOut, MemberOut
from ..schemas.expenses import ExpenseOut
from ..services.common_service import require_group_member
from ..services.expense_service import expense_to_out
from ..utils.mongo_ids import oid, sid
from ..utils.notify import notify_users

router = APIRouter(prefix="/groups", tags=["groups"])


def group_to_out(group: dict, db) -> GroupOut:
    member_oids = group.get("member_ids", [])
    users = list(db["users"].find({"_id": {"$in": member_oids}}, {"name": 1, "email": 1}))
    members = [MemberOut(id=sid(u["_id"]), name=u.get("name", ""), email=u.get("email", "")) for u in users]
    return GroupOut(
        id=sid(group["_id"]),
        name=group["name"],
        created_by=sid(group["created_by"]),
        members=members,
    )


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    me_oid = oid(current_user["id"])

    doc = {
        "name": payload.name,
        "created_by": me_oid,
        "member_ids": [me_oid],
    }

    result = db["groups"].insert_one(doc)
    created = db["groups"].find_one({"_id": result.inserted_id})
    assert created is not None

    return group_to_out(created, db)


@router.get("", response_model=list[GroupOut])
def list_my_groups(db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    rows = db["groups"].find({"member_ids": me_oid}).sort("_id", -1)
    return [group_to_out(group, db) for group in rows]


@router.get("/{group_id}/expenses/pending", response_model=List[ExpenseOut])
def list_pending_expenses_group(
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


@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)
    return group_to_out(group, db)


@router.get("/{group_id}/members")
def list_members(group_id: str, db: Database = Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    member_oids = group.get("member_ids", [])
    users = db["users"].find({"_id": {"$in": member_oids}}, {"name": 1, "email": 1})

    return [{"id": sid(user["_id"]), "name": user.get("name", ""), "email": user.get("email", "")} for user in users]


@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: str,
    payload: AddMemberRequest,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    email = payload.email.strip().lower()
    user = db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["_id"] in group.get("member_ids", []):
        raise HTTPException(status_code=400, detail="User already a member of this group")

    db["groups"].update_one(
        {"_id": group_oid},
        {"$addToSet": {"member_ids": user["_id"]}},
    )

    return {"ok": True}