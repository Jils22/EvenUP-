from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.deps import get_db
from app.services.balance_service import calculate_group_balances
from app.utils.mongo_ids import oid, sid

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "name": current_user.get("name")}


@router.get("/me/balances")
def my_balances(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Aggregate net balance for the current user across all their groups."""
    me_oid = oid(current_user["id"])
    me_id = current_user["id"]

    groups = list(db["groups"].find({"member_ids": me_oid}))

    total_owed_minor = 0       # amount I owe others (net < 0 in my groups)
    total_owed_to_you_minor = 0  # amount others owe me (net > 0 in my groups)

    for group in groups:
        result = calculate_group_balances(db, group["_id"], group.get("member_ids", []))
        my_net = result["net"].get(me_id, 0)
        if my_net > 0:
            total_owed_to_you_minor += my_net
        elif my_net < 0:
            total_owed_minor += abs(my_net)

    return {
        "total_owed_minor": total_owed_minor,
        "total_owed_to_you_minor": total_owed_to_you_minor,
        "net_minor": total_owed_to_you_minor - total_owed_minor,
    }