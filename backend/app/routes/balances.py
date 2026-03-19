from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.services.balance_service import calculate_group_balances
from app.services.common_service import require_group_member
from app.utils.mongo_ids import oid

router = APIRouter(prefix="/groups/{group_id}", tags=["balances"])


@router.get("/balances")
def balances(group_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    group = require_group_member(db, group_oid, me_oid)

    return calculate_group_balances(db, group_oid, group.get("member_ids", []))