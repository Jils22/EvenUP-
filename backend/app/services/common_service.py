from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, List

from bson import ObjectId
from fastapi import HTTPException

from app.utils.mongo_ids import oid

MONEY_2DP = Decimal("0.01")


def require_group_member(db, group_oid: ObjectId, user_oid: ObjectId):
    group = db["groups"].find_one({"_id": group_oid})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if user_oid not in group.get("member_ids", []):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return group


def require_expense_in_group(db, group_oid: ObjectId, expense_oid: ObjectId):
    expense = db["expenses"].find_one({"_id": expense_oid, "group_id": group_oid})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def require_settlement_in_group(db, group_oid: ObjectId, settlement_oid: ObjectId):
    settlement = db["settlements"].find_one({"_id": settlement_oid, "group_id": group_oid})
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    return settlement


def money_to_minor(amount: float, *, allow_zero: bool = False) -> int:
    try:
        d = Decimal(str(amount)).quantize(MONEY_2DP, rounding=ROUND_HALF_UP)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount")

    if allow_zero:
        if d < 0:
            raise HTTPException(status_code=400, detail="amount must be >= 0")
    else:
        if d <= 0:
            raise HTTPException(status_code=400, detail="amount must be > 0")

    return int((d * 100).to_integral_value(rounding=ROUND_HALF_UP))


def ensure_unique_oids(ids: List[str], field: str) -> List[ObjectId]:
    out: List[ObjectId] = []
    seen = set()

    for value in ids:
        obj_id = oid(value)
        if obj_id in seen:
            continue
        seen.add(obj_id)
        out.append(obj_id)

    if not out:
        raise HTTPException(status_code=400, detail=f"{field} required")

    return out


def ensure_all_are_members(member_ids: Iterable[ObjectId], participant_ids: Iterable[ObjectId]):
    member_set = set(member_ids)
    bad = [str(p) for p in participant_ids if p not in member_set]
    if bad:
        raise HTTPException(status_code=400, detail=f"These users are not in the group: {bad}")