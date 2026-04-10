from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from app.core.auth import get_current_user
from app.db.deps import get_db
from app.services.balance_service import calculate_group_balances
from app.utils.mongo_ids import oid, sid
from app.services.expense_service import expense_to_out

router = APIRouter(prefix="/users", tags=["users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UpdateProfileIn(BaseModel):
    name: str


class UpdatePasswordIn(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "name": current_user.get("name")}


@router.patch("/me")
def update_me(body: UpdateProfileIn, db=Depends(get_db), current_user=Depends(get_current_user)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be empty")
    db["users"].update_one({"_id": oid(current_user["id"])}, {"$set": {"name": name}})
    return {"id": current_user["id"], "email": current_user["email"], "name": name}


@router.patch("/me/password")
def change_password(body: UpdatePasswordIn, db=Depends(get_db), current_user=Depends(get_current_user)):
    user_doc = db["users"].find_one({"_id": oid(current_user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_hash = user_doc.get("password_hash") or user_doc.get("hashed_password") or user_doc.get("password", "")
    if not pwd_ctx.verify(body.current_password, stored_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(body.new_password) < 6:
        raise HTTPException(status_code=422, detail="New password must be at least 6 characters")
    
    new_hash = pwd_ctx.hash(body.new_password)
    db["users"].update_one(
        {"_id": oid(current_user["id"])},
        {"$set": {"password": new_hash, "hashed_password": new_hash}}
    )
    return {"message": "Password updated"}


@router.delete("/me")
def delete_me(db=Depends(get_db), current_user=Depends(get_current_user)):
    me_oid = oid(current_user["id"])
    # Remove user from all groups
    db["groups"].update_many({"member_ids": me_oid}, {"$pull": {"member_ids": me_oid}})
    # Delete user record
    db["users"].delete_one({"_id": me_oid})
    return {"message": "Account deleted"}



@router.get("/me/balances")
def my_balances(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Aggregate net balance and simplified transfers for the current user across all their groups."""
    me_oid = oid(current_user["id"])
    me_id = current_user["id"]

    groups = list(db["groups"].find({"member_ids": me_oid}))

    total_owed_minor = 0       # amount I owe others
    total_owed_to_you_minor = 0  # amount others owe me
    global_transfers = []

    for group in groups:
        result = calculate_group_balances(db, group["_id"], group.get("member_ids", []))
        my_net = result["net"].get(me_id, 0)
        
        if my_net > 0:
            total_owed_to_you_minor += my_net
        elif my_net < 0:
            total_owed_minor += abs(my_net)
            
        # Extract transfers involving the current user
        user_names = {}
        for uid in group.get("member_ids", []):
            u = db["users"].find_one({"_id": uid})
            if u:
                user_names[sid(uid)] = u.get("name") or u.get("email")

        for t in result["transfers"]:
            if t["from_user_id"] == me_id or t["to_user_id"] == me_id:
                # Add group info for context
                t["group_id"] = sid(group["_id"])
                t["group_name"] = group.get("name", "Unknown Group")
                t["from_user_name"] = user_names.get(t["from_user_id"], "Unknown")
                t["to_user_name"] = user_names.get(t["to_user_id"], "Unknown")
                global_transfers.append(t)

    return {
        "user_id": me_id,
        "total_owed_minor": total_owed_minor,
        "total_owed_to_you_minor": total_owed_to_you_minor,
        "net_minor": total_owed_to_you_minor - total_owed_minor,
        "global_transfers": global_transfers,
    }

@router.get("/me/analytics")
def my_analytics(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Aggregate spending by category across all user's groups."""
    me_oid = oid(current_user["id"])
    
    # 1. Category Distribution (Pie Chart)
    # We aggregate ALL expenses where the user is a participant OR payer?
    # Actually, let's just aggregate expenses where the user has a share > 0.
    
    expenses_cursor = db["expenses"].find({
        "splits.user_id": me_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    })
    
    category_totals = {}
    total_spend = 0
    
    for exp in expenses_cursor:
        # Find user's specific share in this expense
        user_share = 0
        for split in exp.get("splits", []):
            if split["user_id"] == me_oid:
                user_share = split.get("share_minor", 0)
                break
        
        cat = exp.get("category") or "other"
        category_totals[cat] = category_totals.get(cat, 0) + user_share
        total_spend += user_share
        
    # Format for PieChart: { name: str, value: int, color: str }
    colors = {
        "food": "#C08FF5",
        "travel": "#42E3D0",
        "rent": "#FF6B6B",
        "shopping": "#4AD36E",
        "entertainment": "#FFB84D",
        "transport": "#4D96FF",
        "bills": "#6F7D97",
        "other": "#A8B3C7"
    }
    
    category_data = [
        {
            "name": cat.capitalize(),
            "value": round(amt / 100, 2),
            "color": colors.get(cat, colors["other"])
        }
        for cat, amt in category_totals.items() if amt > 0
    ]

    # 2. Monthly trend — last 6 months of user's spend share
    now = datetime.now(timezone.utc)
    months: dict[str, int] = {}  # "Jan" -> minor
    for i in range(5, -1, -1):
        # Build label for month i months ago
        month_num = (now.month - i - 1) % 12 + 1
        year = now.year - ((now.month - i - 1) // 12 + (1 if (now.month - i - 1) < 0 else 0))
        label = datetime(year, month_num, 1).strftime("%b")
        months[label] = 0

    # Scan all expenses the user participated in
    all_expenses = db["expenses"].find({
        "splits.user_id": me_oid,
        "$or": [{"status": "approved"}, {"status": {"$exists": False}}],
    })
    for exp in all_expenses:
        created = exp.get("created_at")
        if not created:
            created_oid = exp.get("_id")
            created = created_oid.generation_time.replace(tzinfo=timezone.utc) if created_oid else now
        if isinstance(created, str):
            try: created = datetime.fromisoformat(created.replace("Z", "+00:00"))
            except: continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        months_ago = (now.year - created.year) * 12 + (now.month - created.month)
        if months_ago > 5:
            continue
        label = created.strftime("%b")
        for split in exp.get("splits", []):
            if split["user_id"] == me_oid:
                months[label] = months.get(label, 0) + split.get("share_minor", 0)
                break

    trend_data = [{"name": k, "amount": round(v / 100, 2)} for k, v in months.items()]

    return {
        "category_data": category_data,
        "total_spend_minor": total_spend,
        "trend_data": trend_data,
    }