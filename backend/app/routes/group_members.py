from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user

router = APIRouter(prefix="/groups/{group_id}", tags=["group-members"])


def require_group_member(group_id: int, user_id: int) -> None:
    # TODO: Implement with MongoDB
    pass


@router.get("/members")
def list_members(
    group_id: int,
    current_user = Depends(get_current_user),
):
    # TODO: Implement with MongoDB
    raise HTTPException(status_code=501, detail="Not implemented")