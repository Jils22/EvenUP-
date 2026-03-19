from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pymongo.database import Database

from app.core.security import decode_access_token
from app.db.deps import get_db
from app.utils.mongo_ids import oid, sid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db),
):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise cred_exc

        user_oid = oid(user_id)
    except (JWTError, HTTPException):
        raise cred_exc

    user = db["users"].find_one({"_id": user_oid})
    if not user:
        raise cred_exc

    user["id"] = sid(user["_id"])
    return user