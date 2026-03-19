from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.schemas.settlements import SettlementCreate, SettlementOut, SettlementUpdate
from app.services.common_service import money_to_minor, require_group_member, require_settlement_in_group
from app.utils.activity_log import log_activity
from app.utils.audit import log_audit
from app.utils.mongo_ids import oid, sid
from app.utils.notify import notify_users


def settlement_to_out(group_id: str, s: dict) -> SettlementOut:
    created_at = s.get("created_at")
    return SettlementOut(
        id=sid(s["_id"]),
        group_id=group_id,
        from_user_id=sid(s["from_user_id"]),
        to_user_id=sid(s["to_user_id"]),
        amount_minor=int(s["amount_minor"]),
        created_at=(created_at.isoformat() if isinstance(created_at, datetime) else created_at),
        created_by=(sid(s["created_by"]) if s.get("created_by") else None),
    )


def create_settlement_service(db, group_id: str, current_user: dict, payload: SettlementCreate) -> SettlementOut:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    from_oid = oid(payload.from_user_id)
    to_oid = oid(payload.to_user_id)

    if from_oid == to_oid:
        raise HTTPException(status_code=400, detail="from_user_id and to_user_id must be different")

    if from_oid not in group["member_ids"] or to_oid not in group["member_ids"]:
        raise HTTPException(status_code=400, detail="Users must be group members")

    amount_minor = money_to_minor(payload.amount)

    doc = {
        "group_id": group_oid,
        "from_user_id": from_oid,
        "to_user_id": to_oid,
        "amount_minor": amount_minor,
        "created_at": datetime.now(timezone.utc),
        "created_by": me_oid,
    }

    res = db["settlements"].insert_one(doc)
    settlement = db["settlements"].find_one({"_id": res.inserted_id})
    assert settlement is not None

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="settlement",
        verb="created",
        target_id=settlement["_id"],
        data={
            "from_user_id": sid(from_oid),
            "to_user_id": sid(to_oid),
            "amount_minor": amount_minor,
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="settlement.created",
        target_type="settlement",
        target_id=settlement["_id"],
        before=None,
        after={k: settlement.get(k) for k in ["from_user_id", "to_user_id", "amount_minor"]},
    )

    notify_users(
        db,
        user_ids=[from_oid, to_oid],
        notif_type="settlement_created",
        group_id=group_oid,
        data={
            "settlement_id": sid(settlement["_id"]),
            "from_user_id": sid(from_oid),
            "to_user_id": sid(to_oid),
            "amount_minor": amount_minor,
        },
    )

    return settlement_to_out(group_id, settlement)


def update_settlement_service(db, group_id: str, settlement_id: str, current_user: dict, payload: SettlementUpdate) -> SettlementOut:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    settlement_oid = oid(settlement_id)
    settlement = require_settlement_in_group(db, group_oid, settlement_oid)

    if settlement.get("created_by"):
        if settlement["created_by"] != me_oid:
            raise HTTPException(status_code=403, detail="Only the creator can edit this settlement")
    else:
        if settlement["from_user_id"] != me_oid:
            raise HTTPException(status_code=403, detail="Only the payer (from_user_id) can edit this settlement")

    before = {k: settlement.get(k) for k in ["from_user_id", "to_user_id", "amount_minor"]}

    patch = payload.model_dump(exclude_unset=True)

    new_from = oid(patch["from_user_id"]) if "from_user_id" in patch else settlement["from_user_id"]
    new_to = oid(patch["to_user_id"]) if "to_user_id" in patch else settlement["to_user_id"]

    if new_from == new_to:
        raise HTTPException(status_code=400, detail="from_user_id and to_user_id must be different")

    if new_from not in group["member_ids"] or new_to not in group["member_ids"]:
        raise HTTPException(status_code=400, detail="Users must be group members")

    new_amount_minor = int(settlement["amount_minor"])
    if "amount" in patch:
        new_amount_minor = money_to_minor(patch["amount"])

    db["settlements"].update_one(
        {"_id": settlement_oid, "group_id": group_oid},
        {"$set": {
            "from_user_id": new_from,
            "to_user_id": new_to,
            "amount_minor": new_amount_minor,
        }},
    )

    updated = require_settlement_in_group(db, group_oid, settlement_oid)
    after = {k: updated.get(k) for k in ["from_user_id", "to_user_id", "amount_minor"]}

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="settlement",
        verb="updated",
        target_id=updated["_id"],
        data={
            "before": {
                "from_user_id": sid(before["from_user_id"]),
                "to_user_id": sid(before["to_user_id"]),
                "amount_minor": int(before["amount_minor"]),
            },
            "after": {
                "from_user_id": sid(after["from_user_id"]),
                "to_user_id": sid(after["to_user_id"]),
                "amount_minor": int(after["amount_minor"]),
            },
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="settlement.updated",
        target_type="settlement",
        target_id=updated["_id"],
        before=before,
        after=after,
    )

    notify_users(
        db,
        user_ids=[after["from_user_id"], after["to_user_id"]],
        notif_type="settlement_updated",
        group_id=group_oid,
        data={
            "settlement_id": sid(updated["_id"]),
            "from_user_id": sid(after["from_user_id"]),
            "to_user_id": sid(after["to_user_id"]),
            "amount_minor": int(after["amount_minor"]),
        },
    )

    return settlement_to_out(group_id, updated)


def delete_settlement_service(db, group_id: str, settlement_id: str, current_user: dict) -> None:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])

    require_group_member(db, group_oid, me_oid)
    settlement_oid = oid(settlement_id)
    settlement = require_settlement_in_group(db, group_oid, settlement_oid)

    if settlement.get("created_by"):
        if settlement["created_by"] != me_oid:
            raise HTTPException(status_code=403, detail="Only the creator can delete this settlement")
    else:
        if settlement["from_user_id"] != me_oid:
            raise HTTPException(status_code=403, detail="Only the payer (from_user_id) can delete this settlement")

    before = {k: settlement.get(k) for k in ["from_user_id", "to_user_id", "amount_minor"]}

    res = db["settlements"].delete_one({"_id": settlement_oid, "group_id": group_oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Settlement not found")

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="settlement",
        verb="deleted",
        target_id=settlement_oid,
        data={
            "from_user_id": sid(before["from_user_id"]),
            "to_user_id": sid(before["to_user_id"]),
            "amount_minor": int(before["amount_minor"]),
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="settlement.deleted",
        target_type="settlement",
        target_id=settlement_oid,
        before=before,
        after=None,
    )

    notify_users(
        db,
        user_ids=[before["from_user_id"], before["to_user_id"]],
        notif_type="settlement_deleted",
        group_id=group_oid,
        data={
            "settlement_id": sid(settlement_oid),
            "from_user_id": sid(before["from_user_id"]),
            "to_user_id": sid(before["to_user_id"]),
            "amount_minor": int(before["amount_minor"]),
        },
    )