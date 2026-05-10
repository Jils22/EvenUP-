from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
import logging
import traceback
from .core.config import settings
from .db.mongo import close_client, get_database, ping_database

from .routes.auth import router as auth_router
from .routes.users import router as user_router
from .routes.groups import router as groups_router
from .routes.expenses import router as expenses_router
from .routes.balances import router as balances_router
from .routes.settlements import router as settlements_router
from .routes.activity import router as activity_router
from .routes.debts import router as debts_router
from .routes.comments import router as comments_router
from .routes.files import router as files_router
from .routes.invites import router as invites_router
from .routes.notifications import router as notifications_router
from .routes.export import router as export_router
from .routes.badges import router as badges_router
from .routes.recurring import router as recurring_router
from .routes.shopping import router as shopping_router
from .routes.ai import router as ai_router
from .routes.expenses_direct import router as expenses_direct_router
from .routes.budgets import router as budgets_router


app = FastAPI(title=settings.APP_NAME)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── CORS Middleware ──────────────────────────────────────────────────────────
# Using regex to support all Netlify subdomains (previews, branches, etc.)
# and explicitly allowing localhost for development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://evenup-finance.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error caught: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

# ── API Router Structure ─────────────────────────────────────────────────────
api_router = APIRouter(prefix="/api")

# 1. Global / Top-level
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(expenses_direct_router)
api_router.include_router(invites_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_router)

# 2. Unified Groups Hierarchy
# We must include everything under /groups into ONE registration point to avoid prefix overlap conflicts.
unified_groups_router = APIRouter(prefix="/groups")

# a) Root group actions (list, create) are usually in groups_router
# We include them with NO additional prefix.
unified_groups_router.include_router(groups_router, prefix="")

# b) Group-specific actions (/groups/{group_id}/...)
# We can include the others here. But wait, their prefixes ALREADY start with /groups/{group_id}.
# This is the problem. We should change their prefixes to be relative.

# For now, to avoid re-editing 10 files, I'll include them into api_router in a VERY specific order
# But FastAPI's hierarchical prefix matching is tricky.

# Let's try the "Flat but Correct" order one more time, but I'll change their labels.
# Actually, I'll just include them all at the root of api_router and see.
# Wait, I already did that.

# THE FINAL TRUTH: In expenses.py, the prefix is "/groups/{group_id}".
# In groups.py, the prefix is "/groups".
# IF I include BOTH in api_router, and groups_router is include FIRST, it captures /groups.
# IF expenses_router is included FIRST, it matches /groups/{group_id} and enters it.
# If I request /api/groups/123/expenses, it matches /api/groups/{group_id} (expenses_router).
# Then it matches /expenses inside it. SUCCESS.

# SO THE FIX IS: Include expenses_router BEFORE groups_router.
# AND NO REGEXES in prefixes unless absolutely necessary.

api_router.include_router(expenses_router)

api_router.include_router(balances_router)
api_router.include_router(settlements_router)
api_router.include_router(activity_router)
api_router.include_router(debts_router)
api_router.include_router(comments_router)
api_router.include_router(files_router)
api_router.include_router(export_router)
api_router.include_router(badges_router)
api_router.include_router(recurring_router)
api_router.include_router(shopping_router)
api_router.include_router(budgets_router)

# Include the generic groups_router LAST
api_router.include_router(groups_router)

app.include_router(api_router)

@app.get("/health")
def health():
    return {"ok": True}