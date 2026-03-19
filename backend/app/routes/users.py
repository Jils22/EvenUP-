from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "name": current_user.get("name")}