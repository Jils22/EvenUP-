from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.groups import AddMemberRequest, GroupCreate, GroupOut, MemberOut
from app.services.common_service import require_group_member
from app.utils.mongo_ids import oid, sid

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

    return [{"id": sid(user["_id"]), "name": user["name"], "email": user["email"]} for user in users]


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