from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.auth import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.deps import get_db
from app.schemas.auth import AuthResponse, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_response(user: dict) -> UserResponse:
    created_at = user.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    return UserResponse(
        id=str(user["_id"]),
        name=user.get("name"),
        email=user.get("email"),
        created_at=str(created_at) if created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Database = Depends(get_db)):
    email = payload.email.strip().lower()

    try:
        result = db["users"].insert_one(
            {
                "name": payload.name,
                "email": email,
                "password_hash": hash_password(payload.password),
                "created_at": datetime.now(timezone.utc),
            }
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = db["users"].find_one({"_id": result.inserted_id})
    if not user:
        raise HTTPException(status_code=500, detail="Failed to retrieve created user")

    token = create_access_token(subject=str(user["_id"]))
    return AuthResponse(token=token, user=_user_to_response(user))


@router.post("/login", response_model=AuthResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    email = form.username.strip().lower()
    password = form.password

    user = db["users"].find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=str(user["_id"]))
    return AuthResponse(token=token, user=_user_to_response(user))


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return _user_to_response(current_user)