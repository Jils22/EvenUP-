from fastapi import Depends, HTTPException, status
from jose import JWTError
from pymongo.database import Database

from app.core.security import decode_access_token
from app.db.deps import get_db
from app.utils.mongo_ids import oid, sid

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Database = Depends(get_db),
):
    token = credentials.credentials
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

    except JWTError:
        raise cred_exc

    user = db["users"].find_one({"_id": user_oid})
    if not user:
        raise cred_exc

    # Attach string id for convenience
    user["id"] = sid(user["_id"])
    return user


def _user_to_response(user):
    return {
        "id": sid(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
    }