from __future__ import annotations

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..utils.mongo_ids import oid, sid

router = APIRouter(prefix="/users/me/badges", tags=["badges"])


def _compute_badges(db, me_oid, me_id: str) -> list[dict]:
    """
    Compute earned badges for the current user.
    Returns a list of badge dicts: {id, name, description, icon, earned, earned_at}.
    """
    now = datetime.now(timezone.utc)
    badges: list[dict] = []

    # ── 1. FIRST EXPENSE — Created at least one expense ──────────────────────
    first_expense = db["expenses"].find_one({
        "paid_by": me_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    })
    badges.append({
        "id": "first_expense",
        "name": "First Round",
        "description": "You paid for the first expense in a group.",
        "icon": "🎉",
        "category": "milestone",
        "earned": first_expense is not None,
        "earned_at": first_expense["created_at"].isoformat() if first_expense and isinstance(first_expense.get("created_at"), datetime) else None,
    })

    # ── 2. SOCIAL BUTTERFLY — Joined 3+ groups ───────────────────────────────
    group_count = db["groups"].count_documents({"member_ids": me_oid})
    badges.append({
        "id": "social_butterfly",
        "name": "Social Butterfly",
        "description": "Be a member of 3 or more groups.",
        "icon": "🦋",
        "category": "social",
        "earned": group_count >= 3,
        "earned_at": None,
    })

    # ── 3. BIG SPENDER — Paid more than ₹10,000 total ────────────────────────
    pipeline_paid = [
        {"$match": {
            "paid_by": me_oid,
            "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount_minor"}}},
    ]
    paid_result = list(db["expenses"].aggregate(pipeline_paid))
    total_paid_minor = paid_result[0]["total"] if paid_result else 0
    badges.append({
        "id": "big_spender",
        "name": "Big Spender",
        "description": "Pay for expenses totalling ₹10,000 or more.",
        "icon": "💸",
        "category": "spending",
        "earned": total_paid_minor >= 1_000_000,  # minor units (100x)
        "earned_at": None,
    })

    # ── 4. EARLY SETTLER — Created a settlement within 24h of an expense ─────
    settlement = db["settlements"].find_one({"from_user_id": me_oid})
    early_settle = False
    if settlement:
        s_created = settlement.get("created_at")
        if isinstance(s_created, datetime):
            # Find any expense created before (within 24h window) in same group
            cutoff = s_created - timedelta(hours=24)
            ref_expense = db["expenses"].find_one({
                "group_id": settlement["group_id"],
                "created_at": {"$gte": cutoff, "$lte": s_created},
            })
            early_settle = ref_expense is not None
    badges.append({
        "id": "early_settler",
        "name": "Early Settler",
        "description": "Settle up within 24 hours of an expense being recorded.",
        "icon": "⚡",
        "category": "settlement",
        "earned": early_settle,
        "earned_at": settlement["created_at"].isoformat() if early_settle and isinstance(settlement.get("created_at"), datetime) else None,
    })

    # ── 5. THE BANKER — Paid in 10+ expenses ─────────────────────────────────
    expense_paid_count = db["expenses"].count_documents({
        "paid_by": me_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    })
    badges.append({
        "id": "the_banker",
        "name": "The Banker",
        "description": "Pay for 10 or more expenses across all groups.",
        "icon": "🏦",
        "category": "spending",
        "earned": expense_paid_count >= 10,
        "earned_at": None,
    })

    # ── 6. TRENDSETTER — Added an expense in each of 5 different categories ──
    pipeline_cats = [
        {"$match": {
            "paid_by": me_oid, 
            "category": {"$exists": True, "$ne": None},
            "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
        }},
        {"$group": {"_id": "$category"}},
    ]
    unique_cats = list(db["expenses"].aggregate(pipeline_cats))
    badges.append({
        "id": "trendsetter",
        "name": "Trendsetter",
        "description": "Record expenses across 5 different categories.",
        "icon": "🌈",
        "category": "exploration",
        "earned": len(unique_cats) >= 5,
        "earned_at": None,
    })

    # ── 7. TEAM PLAYER — Added expense with 5+ participants ──────────────────
    large_split = db["expenses"].find_one({
        "paid_by": me_oid, 
        "splits.4": {"$exists": True},
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    })
    badges.append({
        "id": "team_player",
        "name": "Team Player",
        "description": "Split an expense among 5 or more people.",
        "icon": "🤝",
        "category": "social",
        "earned": large_split is not None,
        "earned_at": large_split["created_at"].isoformat() if large_split and isinstance(large_split.get("created_at"), datetime) else None,
    })

    # ── 8. MONTH STREAK — Active (participated in expense) 3 consecutive months
    months_active: set[str] = set()
    for exp in db["expenses"].find({
        "splits.user_id": me_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    }, {"created_at": 1}):
        created = exp.get("created_at")
        if isinstance(created, datetime):
            months_active.add(f"{created.year}-{created.month:02d}")
    has_streak = False
    if len(months_active) >= 3:
        sorted_months = sorted(months_active)
        for i in range(len(sorted_months) - 2):
            y0, m0 = map(int, sorted_months[i].split("-"))
            y1, m1 = map(int, sorted_months[i + 1].split("-"))
            y2, m2 = map(int, sorted_months[i + 2].split("-"))
            # Check consecutive months
            if (y1 * 12 + m1 == y0 * 12 + m0 + 1) and (y2 * 12 + m2 == y1 * 12 + m1 + 1):
                has_streak = True
                break
    badges.append({
        "id": "month_streak",
        "name": "On a Roll",
        "description": "Be active in expenses for 3 consecutive months.",
        "icon": "🔥",
        "category": "streak",
        "earned": has_streak,
        "earned_at": None,
    })

    return badges


@router.get("")
def get_my_badges(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Return all badges with earned/unearned status for the current user."""
    me_oid = oid(current_user["id"])
    me_id = current_user["id"]
    badges = _compute_badges(db, me_oid, me_id)
    earned_count = sum(1 for b in badges if b["earned"])
    return {
        "total": len(badges),
        "earned": earned_count,
        "badges": badges,
    }


@router.get("/summary")
def get_badge_summary(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Lightweight endpoint returning just the count of earned badges."""
    me_oid = oid(current_user["id"])
    me_id = current_user["id"]
    badges = _compute_badges(db, me_oid, me_id)
    earned = [b for b in badges if b["earned"]]
    return {
        "earned": len(earned),
        "total": len(badges),
        "latest": earned[-1] if earned else None,
    }
