from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List

from bson import ObjectId
from fastapi import HTTPException

from app.schemas.expenses import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.services.common_service import (
    ensure_all_are_members,
    ensure_unique_oids,
    money_to_minor,
    require_expense_in_group,
    require_group_member,
)
from app.utils.activity_log import log_activity
from app.utils.audit import log_audit
from app.utils.mongo_ids import oid, sid
from app.utils.notify import notify_users


def build_equal_splits(amount_minor: int, participants: List[ObjectId]) -> List[Dict[str, Any]]:
    if len(participants) < 2:
        raise HTTPException(status_code=400, detail="Participants required (min 2)")

    n = len(participants)
    base = amount_minor // n
    rem = amount_minor - (base * n)

    shares = [base] * n
    shares[-1] += rem

    return [{"user_id": participants[i], "share_minor": shares[i]} for i in range(n)]


def build_exact_splits(amount_minor: int, splits_in: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not splits_in or len(splits_in) < 2:
        raise HTTPException(status_code=400, detail="splits required (min 2) for exact")

    seen = set()
    out: List[Dict[str, Any]] = []
    total = 0
    positive_count = 0

    for item in splits_in:
        user_oid = oid(item["user_id"])
        if user_oid in seen:
            raise HTTPException(status_code=400, detail="Duplicate user_id in splits")
        seen.add(user_oid)

        share_minor = money_to_minor(item["amount"], allow_zero=True)
        if share_minor > 0:
            positive_count += 1

        total += share_minor
        out.append({"user_id": user_oid, "share_minor": share_minor})

    if positive_count == 0:
        raise HTTPException(status_code=400, detail="At least one split amount must be > 0")

    if total != amount_minor:
        raise HTTPException(
            status_code=400,
            detail=f"Exact splits must sum to amount. splits_total_minor={total} amount_minor={amount_minor}",
        )

    return out


def build_percent_splits(amount_minor: int, percents_in: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not percents_in or len(percents_in) < 2:
        raise HTTPException(status_code=400, detail="percents required (min 2) for percent")

    seen = set()
    entries: List[tuple[ObjectId, Decimal]] = []
    total_pct = Decimal("0")
    positive_count = 0

    for item in percents_in:
        user_oid = oid(item["user_id"])
        if user_oid in seen:
            raise HTTPException(status_code=400, detail="Duplicate user_id in percents")
        seen.add(user_oid)

        pct = Decimal(str(item["percent"]))
        if pct < 0 or pct > 100:
            raise HTTPException(status_code=400, detail="percent must be in [0, 100]")

        if pct > 0:
            positive_count += 1

        total_pct += pct
        entries.append((user_oid, pct))

    if positive_count == 0:
        raise HTTPException(status_code=400, detail="At least one percent must be > 0")

    if (total_pct - Decimal("100")).copy_abs() > Decimal("0.01"):
        raise HTTPException(status_code=400, detail=f"percents must sum to 100. got={total_pct}")

    shares: List[int] = []
    for _, pct in entries:
        share = (Decimal(amount_minor) * pct / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        shares.append(int(share))

    diff = amount_minor - sum(shares)
    shares[-1] += diff

    return [{"user_id": entries[i][0], "share_minor": shares[i]} for i in range(len(entries))]


def expense_to_out(e: Dict[str, Any]) -> ExpenseOut:
    return ExpenseOut(
        id=sid(e["_id"]),
        group_id=sid(e["group_id"]),
        title=e["title"],
        amount_minor=int(e["amount_minor"]),
        paid_by=sid(e["paid_by"]),
        split_type=e.get("split_type", "equal"),
        splits=[
            {"user_id": sid(s["user_id"]), "share_minor": int(s["share_minor"])}
            for s in e.get("splits", [])
        ],
    )


def expense_user_oids(e: Dict[str, Any]) -> List[ObjectId]:
    users = {e["paid_by"]}
    for split in e.get("splits", []):
        users.add(split["user_id"])
    return list(users)


def create_expense_service(db, group_id: str, current_user: dict, payload: ExpenseCreate) -> ExpenseOut:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    paid_by_oid = oid(payload.paid_by_user_id)
    if paid_by_oid not in group.get("member_ids", []):
        raise HTTPException(status_code=400, detail="paid_by_user_id must be a member of the group")

    amount_minor = money_to_minor(payload.amount)
    split_type = payload.split_type
    now = datetime.now(timezone.utc)

    doc: Dict[str, Any] = {
        "group_id": group_oid,
        "title": payload.title,
        "amount_minor": amount_minor,
        "paid_by": paid_by_oid,
        "split_type": split_type,
        "created_at": now,
        "updated_at": now,
    }

    if split_type == "equal":
        participant_ids = ensure_unique_oids(payload.participant_user_ids, "participant_user_ids")
        if paid_by_oid not in participant_ids:
            raise HTTPException(status_code=400, detail="paid_by must be included in participant_user_ids")

        ensure_all_are_members(group.get("member_ids", []), participant_ids)
        doc["participant_user_ids"] = participant_ids
        doc["splits"] = build_equal_splits(amount_minor, participant_ids)

    elif split_type == "exact":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="splits required for exact")

        splits_in = [{"user_id": s.user_id, "amount": s.amount} for s in payload.splits]
        participant_ids = [oid(s["user_id"]) for s in splits_in]

        if paid_by_oid not in participant_ids:
            raise HTTPException(status_code=400, detail="paid_by must be included in exact splits")

        ensure_all_are_members(group.get("member_ids", []), participant_ids)
        doc["splits"] = build_exact_splits(amount_minor, splits_in)

    elif split_type == "percent":
        if not payload.percents:
            raise HTTPException(status_code=400, detail="percents required for percent")

        perc_in = [{"user_id": p.user_id, "percent": p.percent} for p in payload.percents]
        participant_ids = [oid(p["user_id"]) for p in perc_in]

        if paid_by_oid not in participant_ids:
            raise HTTPException(status_code=400, detail="paid_by must be included in percent splits")

        ensure_all_are_members(group.get("member_ids", []), participant_ids)
        doc["percents_config"] = [{"user_id": oid(p["user_id"]), "percent": float(p["percent"])} for p in perc_in]
        doc["splits"] = build_percent_splits(amount_minor, perc_in)

    else:
        raise HTTPException(status_code=400, detail="Invalid split_type")

    result = db["expenses"].insert_one(doc)
    created = db["expenses"].find_one({"_id": result.inserted_id})
    assert created is not None

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="expense",
        verb="created",
        target_id=created["_id"],
        data={
            "title": created["title"],
            "amount_minor": int(created["amount_minor"]),
            "paid_by": sid(created["paid_by"]),
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="expense.created",
        target_type="expense",
        target_id=created["_id"],
        before=None,
        after={k: created.get(k) for k in ["title", "amount_minor", "paid_by", "split_type", "splits", "percents_config"]},
    )

    notify_users(
        db,
        user_ids=expense_user_oids(created),
        notif_type="expense_created",
        group_id=group_oid,
        data={
            "expense_id": sid(created["_id"]),
            "title": created["title"],
            "amount_minor": int(created["amount_minor"]),
            "paid_by": sid(created["paid_by"]),
        },
    )

    return expense_to_out(created)


def update_expense_service(db, group_id: str, expense_id: str, current_user: dict, payload: ExpenseUpdate) -> ExpenseOut:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = require_expense_in_group(db, group_oid, expense_oid)

    if expense["paid_by"] != me_oid:
        raise HTTPException(status_code=403, detail="Only the payer can edit this expense")

    before = {k: expense.get(k) for k in ["title", "amount_minor", "paid_by", "split_type", "splits", "percents_config"]}

    patch = payload.model_dump(exclude_unset=True)
    new_title = patch.get("title", expense["title"])
    new_split_type = patch.get("split_type", expense.get("split_type", "equal"))
    new_amount_minor = int(expense["amount_minor"])

    amount_changed = "amount" in patch
    if amount_changed:
        new_amount_minor = money_to_minor(patch["amount"])

    update_doc: Dict[str, Any] = {
        "title": new_title,
        "split_type": new_split_type,
        "amount_minor": new_amount_minor,
        "updated_at": datetime.now(timezone.utc),
    }

    if new_split_type != "percent":
        update_doc["percents_config"] = None

    if new_split_type == "equal":
        if patch.get("participant_user_ids") is not None:
            participant_ids = ensure_unique_oids(patch["participant_user_ids"], "participant_user_ids")
        else:
            participant_ids = [sp["user_id"] for sp in expense.get("splits", [])]

        if len(participant_ids) < 2:
            raise HTTPException(status_code=400, detail="Participants required (min 2)")

        ensure_all_are_members(group.get("member_ids", []), participant_ids)
        if expense["paid_by"] not in participant_ids:
            raise HTTPException(status_code=400, detail="paid_by must be included in participant_user_ids")

        update_doc["participant_user_ids"] = participant_ids
        update_doc["splits"] = build_equal_splits(new_amount_minor, participant_ids)

    elif new_split_type == "exact":
        if patch.get("splits") is not None:
            splits_in = [{"user_id": s["user_id"], "amount": s["amount"]} for s in patch["splits"]]
            participant_ids = [oid(s["user_id"]) for s in splits_in]

            ensure_all_are_members(group.get("member_ids", []), participant_ids)
            if expense["paid_by"] not in participant_ids:
                raise HTTPException(status_code=400, detail="paid_by must be included in exact splits")

            update_doc["splits"] = build_exact_splits(new_amount_minor, splits_in)

        elif amount_changed or ("split_type" in patch):
            raise HTTPException(status_code=400, detail="splits required when changing amount or split_type to exact")
        else:
            update_doc["splits"] = expense.get("splits", [])

    elif new_split_type == "percent":
        if patch.get("percents") is not None:
            perc_in = [{"user_id": p["user_id"], "percent": p["percent"]} for p in patch["percents"]]
        else:
            stored = expense.get("percents_config")
            if stored is None:
                raise HTTPException(status_code=400, detail="percents required (or missing stored percents_config) for percent split")
            perc_in = [{"user_id": sid(x["user_id"]), "percent": x["percent"]} for x in stored]

        participant_ids = [oid(p["user_id"]) for p in perc_in]
        ensure_all_are_members(group.get("member_ids", []), participant_ids)

        if expense["paid_by"] not in participant_ids:
            raise HTTPException(status_code=400, detail="paid_by must be included in percent splits")

        update_doc["splits"] = build_percent_splits(new_amount_minor, perc_in)
        update_doc["percents_config"] = [{"user_id": oid(p["user_id"]), "percent": float(p["percent"])} for p in perc_in]

    else:
        raise HTTPException(status_code=400, detail="Invalid split_type")

    db["expenses"].update_one({"_id": expense_oid, "group_id": group_oid}, {"$set": update_doc})

    updated = require_expense_in_group(db, group_oid, expense_oid)
    after = {k: updated.get(k) for k in ["title", "amount_minor", "paid_by", "split_type", "splits", "percents_config"]}

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="expense",
        verb="updated",
        target_id=updated["_id"],
        data={
            "before": {
                "title": before.get("title"),
                "amount_minor": int(before.get("amount_minor")),
                "split_type": before.get("split_type"),
            },
            "after": {
                "title": after.get("title"),
                "amount_minor": int(after.get("amount_minor")),
                "split_type": after.get("split_type"),
            },
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="expense.updated",
        target_type="expense",
        target_id=updated["_id"],
        before=before,
        after=after,
    )

    notify_users(
        db,
        user_ids=expense_user_oids(updated),
        notif_type="expense_updated",
        group_id=group_oid,
        data={
            "expense_id": sid(updated["_id"]),
            "title": updated["title"],
            "amount_minor": int(updated["amount_minor"]),
            "paid_by": sid(updated["paid_by"]),
        },
    )

    return expense_to_out(updated)


def delete_expense_service(db, group_id: str, expense_id: str, current_user: dict) -> None:
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    expense_oid = oid(expense_id)
    expense = require_expense_in_group(db, group_oid, expense_oid)

    if expense["paid_by"] != me_oid:
        raise HTTPException(status_code=403, detail="Only the payer can delete this expense")

    before = {k: expense.get(k) for k in ["title", "amount_minor", "paid_by", "split_type", "splits", "percents_config"]}
    involved = expense_user_oids(expense)

    res = db["expenses"].delete_one({"_id": expense_oid, "group_id": group_oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    log_activity(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        event_type="expense",
        verb="deleted",
        target_id=expense_oid,
        data={
            "title": before.get("title"),
            "amount_minor": int(before.get("amount_minor")),
            "paid_by": sid(before.get("paid_by")),
        },
    )

    log_audit(
        db,
        group_id=group_oid,
        actor_id=me_oid,
        action="expense.deleted",
        target_type="expense",
        target_id=expense_oid,
        before=before,
        after=None,
    )

    notify_users(
        db,
        user_ids=involved,
        notif_type="expense_deleted",
        group_id=group_oid,
        data={
            "expense_id": sid(expense_oid),
            "title": before.get("title"),
            "amount_minor": int(before.get("amount_minor")),
            "paid_by": sid(before.get("paid_by")),
        },
    )