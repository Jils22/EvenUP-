from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongo import close_client, get_database, ping_database
from app.routes.auth import router as auth_router
from app.routes.users import router as user_router
from app.routes.groups import router as groups_router
from app.routes.expenses import router as expenses_router
from app.routes.balances import router as balances_router
from app.routes.settlements import router as settlements_router
from app.routes.activity import router as activity_router
from app.routes.debts import router as debts_router
from app.routes.comments import router as comments_router
from app.routes.files import router as files_router
from app.routes.invites import router as invites_router
from app.routes.notifications import router as notifications_router
from app.routes.export import router as export_router
from app.routes.badges import router as badges_router
from app.routes.recurring import router as recurring_router
from app.routes.shopping import router as shopping_router
from app.routes.ai import router as ai_router
from app.routes.expenses_direct import router as expenses_direct_router
from app.routes.budgets import router as budgets_router
from app.routes.approvals import router as approvals_router

app = FastAPI(title=settings.APP_NAME, openapi_prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(groups_router)
app.include_router(expenses_router)
app.include_router(balances_router)
app.include_router(settlements_router)
app.include_router(activity_router)
app.include_router(debts_router)
app.include_router(comments_router)
app.include_router(files_router)
app.include_router(invites_router)
app.include_router(notifications_router)
app.include_router(export_router)
app.include_router(badges_router)
app.include_router(recurring_router)
app.include_router(shopping_router)
app.include_router(ai_router)
app.include_router(expenses_direct_router)
app.include_router(budgets_router)
app.include_router(approvals_router)


@app.get("/health")
def health():
    return {"ok": True}


@app.on_event("startup")
def ensure_indexes():
    ping_database()
    db = get_database()

    db["users"].create_index("email", unique=True)
    db["groups"].create_index("member_ids")

    db["expenses"].create_index("group_id")
    db["expenses"].create_index([("group_id", 1), ("created_at", -1)])

    db["settlements"].create_index("group_id")
    db["settlements"].create_index([("group_id", 1), ("created_at", -1)])

    db["activity"].create_index([("group_id", 1), ("created_at", -1)])

    db["expense_comments"].create_index([("expense_id", 1), ("created_at", -1)])
    db["expense_comments"].create_index([("group_id", 1), ("created_at", -1)])

    db["files"].create_index([("expense_id", 1), ("created_at", -1)])
    db["files"].create_index([("group_id", 1), ("created_at", -1)])

    db["invites"].create_index("token_hash", unique=True)
    db["invites"].create_index([("group_id", 1), ("expires_at", 1)])

    db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
    db["notifications"].create_index([("user_id", 1), ("is_read", 1), ("created_at", -1)])

    db["audit_logs"].create_index([("group_id", 1), ("created_at", -1)])
    db["audit_logs"].create_index([("actor_id", 1), ("created_at", -1)])

    # New collections for premium features
    db["recurring_expenses"].create_index([("group_id", 1), ("active", 1)])
    db["recurring_expenses"].create_index([("group_id", 1), ("next_due", 1)])
    db["shopping_items"].create_index([("group_id", 1), ("_id", 1)])
    db["budgets"].create_index([("user_id", 1), ("category", 1)], unique=True)

    # Consensus / approval indexes
    db["expenses"].create_index([("group_id", 1), ("status", 1)])
    db["expenses"].create_index([("group_id", 1), ("status", 1), ("expires_at", 1)])


@app.on_event("shutdown")
def shutdown_db_client():
    close_client()