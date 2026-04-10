from __future__ import annotations

from typing import Dict, List

from bson import ObjectId

from app.utils.mongo_ids import sid


def calculate_group_balances(db, group_oid: ObjectId, member_oids: List[ObjectId]) -> Dict[str, object]:
    net: Dict[str, int] = {sid(u): 0 for u in member_oids}

    # Expenses: only approved (or legacy docs without a status field)
    # payer gets +amount, each participant gets -share
    for expense in db["expenses"].find({
        "group_id": group_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    }):
        paid_by = sid(expense["paid_by"])
        net[paid_by] = net.get(paid_by, 0) + int(expense["amount_minor"])

        for split in expense.get("splits", []):
            uid = sid(split["user_id"])
            net[uid] = net.get(uid, 0) - int(split["share_minor"])

    # Settlements:
    # from_user pays to_user -> from_user owes less, to_user receives credit
    for settlement in db["settlements"].find({"group_id": group_oid}):
        from_uid = sid(settlement["from_user_id"])
        to_uid = sid(settlement["to_user_id"])
        amount = int(settlement["amount_minor"])

        net[from_uid] -= amount  # from_user's debt reduced
        net[to_uid] += amount    # to_user receives credit

    creditors = [[uid, amt] for uid, amt in net.items() if amt > 0]
    debtors = [[uid, -amt] for uid, amt in net.items() if amt < 0]

    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    transfers = []
    i = j = 0

    while i < len(debtors) and j < len(creditors):
        debtor_uid, debtor_amt = debtors[i]
        creditor_uid, creditor_amt = creditors[j]

        settled = min(debtor_amt, creditor_amt)
        transfers.append({
            "from_user_id": debtor_uid,
            "to_user_id": creditor_uid,
            "amount_minor": settled,
        })

        debtors[i][1] -= settled
        creditors[j][1] -= settled

        if debtors[i][1] == 0:
            i += 1
        if creditors[j][1] == 0:
            j += 1

    return {"net": net, "transfers": transfers}