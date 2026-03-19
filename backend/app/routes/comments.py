from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.utils.mongo_ids import oid, sid

router = APIRouter(prefix="/groups/{group_id}", tags=["comments"])


def require_group_member(db, group_oid: ObjectId, user_oid: ObjectId):
    g = db["groups"].find_one({"_id": group_oid})
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    if user_oid not in g.get("member_ids", []):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return g


def require_expense_in_group(db, group_oid: ObjectId, expense_oid: ObjectId):
    e = db["expenses"].find_one({"_id": expense_oid, "group_id": group_oid})
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    return e


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: str
    group_id: str
    expense_id: str
    user_id: str
    text: str
    created_at: datetime


@router.post("/expenses/{expense_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    group_id: str,
    expense_id: str,
    payload: CommentCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    require_expense_in_group(db, group_oid, expense_oid)

    doc = {
        "group_id": group_oid,
        "expense_id": expense_oid,
        "user_id": me_oid,
        "text": payload.text.strip(),
        "created_at": datetime.now(timezone.utc),
    }

    res = db["expense_comments"].insert_one(doc)
    c = db["expense_comments"].find_one({"_id": res.inserted_id})

    return CommentOut(
        id=sid(c["_id"]),
        group_id=sid(c["group_id"]),
        expense_id=sid(c["expense_id"]),
        user_id=sid(c["user_id"]),
        text=c["text"],
        created_at=c["created_at"],
    )


@router.get("/expenses/{expense_id}/comments", response_model=List[CommentOut])
def list_comments(
    group_id: str,
    expense_id: str,
    limit: int = 50,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")

    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    require_expense_in_group(db, group_oid, expense_oid)

    docs = list(
        db["expense_comments"]
        .find({"group_id": group_oid, "expense_id": expense_oid})
        .sort([("created_at", -1), ("_id", -1)])
        .limit(limit)
    )

    out: List[CommentOut] = []
    for c in docs:
        out.append(
            CommentOut(
                id=sid(c["_id"]),
                group_id=sid(c["group_id"]),
                expense_id=sid(c["expense_id"]),
                user_id=sid(c["user_id"]),
                text=c["text"],
                created_at=c["created_at"],
            )
        )
    return out