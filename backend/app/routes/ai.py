from fastapi import APIRouter, Depends
from app.db.deps import get_db
from app.core.auth import get_current_user
from app.utils.mongo_ids import object_id as oid, sid
from datetime import datetime, timezone
from collections import defaultdict

router = APIRouter(prefix="/ai", tags=["AI Advisor"])


def _month_range():
    now = datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start


def _build_analytics(db, me_oid):
    """Return spending data used by both /insights and /chat."""
    expenses = list(db["expenses"].find({"splits.user_id": me_oid}))

    cat_totals = defaultdict(int)
    group_spend = defaultdict(int)
    month_spend = 0
    month_start = _month_range()
    top_expense = None

    for exp in expenses:
        share = next(
            (s.get("share_minor", 0) for s in exp.get("splits", []) if s["user_id"] == me_oid),
            0,
        )
        cat = exp.get("category") or "other"
        cat_totals[cat] += share
        group_spend[sid(exp["group_id"])] += share
        created = exp.get("created_at")
        if created and (
            (isinstance(created, datetime) and created.replace(tzinfo=timezone.utc) >= month_start)
            or (isinstance(created, str) and created >= month_start.isoformat())
        ):
            month_spend += share
        if top_expense is None or share > top_expense["share"]:
            top_expense = {"title": exp.get("title", "Expense"), "share": share, "amount": exp.get("amount_minor", 0)}

    top_cat = max(cat_totals, key=cat_totals.get) if cat_totals else "other"
    top_group_id = max(group_spend, key=group_spend.get) if group_spend else None
    top_group_name = "Unknown"
    if top_group_id:
        g = db["groups"].find_one({"_id": oid(top_group_id)})
        top_group_name = g["name"] if g else "Unknown"

    # Balances
    settlements = list(db["settlements"].find({
        "$or": [{"from_user_id": me_oid}, {"to_user_id": me_oid}]
    }))
    owe_map = defaultdict(int)  # > 0 means I owe them
    for s in settlements:
        if s["from_user_id"] == me_oid:
            owe_map[sid(s["to_user_id"])] += s.get("amount_minor", 0)
        else:
            owe_map[sid(s["from_user_id"])] -= s.get("amount_minor", 0)

    # Net from expenses
    for exp in expenses:
        paid_by = exp.get("paid_by")
        for split in exp.get("splits", []):
            if split["user_id"] == me_oid and paid_by != me_oid:
                owe_map[sid(paid_by)] += split.get("share_minor", 0)
            elif split["user_id"] != me_oid and paid_by == me_oid:
                owe_map[sid(split["user_id"])] -= split.get("share_minor", 0)

    total_owed = sum(v for v in owe_map.values() if v > 0)
    total_owed_to_you = -sum(v for v in owe_map.values() if v < 0)
    max_owe_id = max((k for k, v in owe_map.items() if v > 0), key=lambda k: owe_map[k], default=None)
    max_owe_name = "Someone"
    if max_owe_id:
        u = db["users"].find_one({"_id": oid(max_owe_id)})
        max_owe_name = u["name"] if u else max_owe_id

    upcoming = list(db["recurring_expenses"].find({"active": True}).sort("next_due", 1).limit(1))
    next_bill = None
    if upcoming:
        r = upcoming[0]
        next_bill = {"name": r.get("title", "Bill"), "amount": r.get("amount_minor", 0) / 100}

    return {
        "cat_totals": dict(cat_totals),
        "top_cat": top_cat,
        "top_group_name": top_group_name,
        "month_spend": month_spend,
        "total_owed": total_owed,
        "total_owed_to_you": total_owed_to_you,
        "max_owe_name": max_owe_name,
        "max_owe_amount": owe_map.get(max_owe_id, 0) if max_owe_id else 0,
        "top_expense": top_expense,
        "next_bill": next_bill,
    }


def _rupees(minor: int) -> str:
    return f"₹{minor / 100:.2f}"


@router.get("/insights")
def get_insights(db=Depends(get_db), current_user=Depends(get_current_user)):
    me = oid(current_user["id"])
    d = _build_analytics(db, me)

    insights = []

    if d["total_owed"] > 0:
        insights.append({
            "type": "warning",
            "icon": "💸",
            "title": "Outstanding Debt",
            "body": f"You owe a total of {_rupees(d['total_owed'])}. Your largest debt is to {d['max_owe_name']} ({_rupees(d['max_owe_amount'])}).",
            "action": "Settle Now",
            "action_route": "/settlements",
        })

    if d["total_owed_to_you"] > 0:
        insights.append({
            "type": "success",
            "icon": "🎉",
            "title": "Money Coming Back",
            "body": f"Others owe you {_rupees(d['total_owed_to_you'])} in total. Consider reminding your groups to settle up.",
            "action": "View Balances",
            "action_route": "/settlements",
        })

    if d["month_spend"] > 0:
        top = d["top_cat"].capitalize()
        insights.append({
            "type": "info",
            "icon": "📊",
            "title": "This Month's Spending",
            "body": f"You've spent {_rupees(d['month_spend'])} this month. Your top category is {top}.",
            "action": "View Analytics",
            "action_route": "/analytics",
        })

    if d["next_bill"]:
        nb = d["next_bill"]
        insights.append({
            "type": "warning",
            "icon": "📅",
            "title": "Upcoming Bill",
            "body": f"Your next recurring bill '{nb['name']}' of ₹{nb['amount']:.2f} is due soon.",
            "action": "View Recurring",
            "action_route": "/recurring",
        })

    if not insights:
        insights.append({
            "type": "success",
            "icon": "✅",
            "title": "You're All Clear!",
            "body": "No outstanding debts or upcoming bills. Your finances are in great shape.",
            "action": None,
            "action_route": None,
        })

    top_cats = sorted(d["cat_totals"].items(), key=lambda x: -x[1])[:3]
    return {
        "insights": insights,
        "summary": {
            "total_owed": d["total_owed"],
            "total_owed_to_you": d["total_owed_to_you"],
            "month_spend": d["month_spend"],
            "top_group": d["top_group_name"],
            "top_categories": [{"name": c, "amount_minor": v} for c, v in top_cats],
        },
    }


@router.post("/chat")
def chat(payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    me = oid(current_user["id"])
    d = _build_analytics(db, me)
    q = payload.get("message", "").lower().strip()

    def reply(text: str):
        return {"reply": text}

    if any(w in q for w in ["owe", "debt", "who"]):
        if d["total_owed"] == 0:
            return reply("You have no outstanding debts. You're all clear! 🎉")
        return reply(
            f"You owe a total of {_rupees(d['total_owed'])}. "
            f"Your biggest debt is to **{d['max_owe_name']}** — {_rupees(d['max_owe_amount'])}. "
            f"Head to Settlements to pay up."
        )

    if any(w in q for w in ["spend", "spent", "month", "budget"]):
        cats = ", ".join(f"{c}: {_rupees(v)}" for c, v in sorted(d["cat_totals"].items(), key=lambda x: -x[1])[:3])
        return reply(
            f"This month you've spent {_rupees(d['month_spend'])}. "
            f"Top categories: {cats if cats else 'none yet'}."
        )

    if any(w in q for w in ["food", "travel", "rent", "shopping", "entertainment", "transport", "bills"]):
        for cat in ["food", "travel", "rent", "shopping", "entertainment", "transport", "bills"]:
            if cat in q:
                amt = d["cat_totals"].get(cat, 0)
                return reply(f"Your total spending on **{cat}** is {_rupees(amt)}." if amt else f"No expenses recorded under **{cat}** yet.")

    if any(w in q for w in ["group", "top", "most"]):
        return reply(f"Your most active group is **{d['top_group_name']}**. That's where most of your shared expenses are.")

    if any(w in q for w in ["bill", "recurring", "subscription", "upcoming"]):
        if d["next_bill"]:
            nb = d["next_bill"]
            return reply(f"Your next upcoming bill is **{nb['name']}** for ₹{nb['amount']:.2f}. Check Recurring Bills for the full list.")
        return reply("You have no recurring bills set up yet. Add them in the Recurring section.")

    if any(w in q for w in ["advice", "tip", "suggest", "help", "improve"]):
        if d["total_owed"] > d["total_owed_to_you"]:
            return reply(f"💡 My top advice: settle your debt with **{d['max_owe_name']}** first ({_rupees(d['max_owe_amount'])}). Clearing debts early builds trust in your groups.")
        if d["total_owed_to_you"] > 0:
            return reply(f"💡 You're owed {_rupees(d['total_owed_to_you'])}. Send a friendly reminder to your groups — most people settle quickly when asked.")
        return reply("💡 Great financial hygiene! Keep tracking expenses as they happen to stay on top of group balances.")

    if any(w in q for w in ["hi", "hello", "hey"]):
        return reply(f"Hi! 👋 I'm your EvenUP AI Advisor. Ask me about your debts, spending by category, upcoming bills, or financial tips!")

    return reply(
        "I can help with: your debts, monthly spending, category breakdowns, upcoming bills, and financial tips. What would you like to know? 🤔"
    )
