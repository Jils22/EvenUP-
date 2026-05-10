from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..schemas.settlements import SettlementCreate, SettlementOut, SettlementUpdate
from ..services.common_service import require_group_member
from ..services.settlement_service import (
    create_settlement_service,
    delete_settlement_service,
    settlement_to_out,
    update_settlement_service,
)
from ..utils.mongo_ids import oid

router = APIRouter(prefix="/groups/{group_id}/settlements", tags=["settlements"])


@router.post("", response_model=SettlementOut, status_code=201)
def create_settlement(group_id: str, payload: SettlementCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return create_settlement_service(db, group_id, current_user, payload)


@router.get("", response_model=list[SettlementOut])
def list_settlements(group_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    rows = db["settlements"].find({"group_id": group_oid}).sort("_id", -1)
    return [settlement_to_out(group_id, s) for s in rows]


@router.patch("/{settlement_id}", response_model=SettlementOut)
def update_settlement(group_id: str, settlement_id: str, payload: SettlementUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return update_settlement_service(db, group_id, settlement_id, current_user, payload)


@router.delete("/{settlement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_settlement(group_id: str, settlement_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    delete_settlement_service(db, group_id, settlement_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)