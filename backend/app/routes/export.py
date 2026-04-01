from __future__ import annotations

import csv
import io
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pymongo.database import Database

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.schemas.expenses import ExpenseOut
from app.services.common_service import require_group_member
from app.utils.mongo_ids import oid

router = APIRouter(tags=["export"])


@router.get("/groups/{group_id}/export", response_class=StreamingResponse)
def export_group_expenses(
    group_id: str,
    db: Database = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    # Fetch expenses
    expenses = list(
        db["expenses"]
        .find({"group_id": group_oid})
        .sort([("created_at", -1)])
    )

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Date", "Title", "Amount", "Paid By", "Split Type", "Category"
    ])
    
    # Rows
    for exp in expenses:
        paid_by_name = "Unknown"
        user_doc = db["users"].find_one({"_id": exp.get("paid_by")})
        if user_doc:
            paid_by_name = user_doc.get("name") or user_doc.get("email", "Unknown")

        # Safely format the date regardless of type
        raw_date = exp.get("created_at")
        if hasattr(raw_date, "strftime"):
            date_str = raw_date.strftime("%Y-%m-%d")
        elif isinstance(raw_date, str):
            date_str = raw_date[:10]
        else:
            # Fallback: extract from ObjectId generation time
            try:
                date_str = exp["_id"].generation_time.strftime("%Y-%m-%d")
            except Exception:
                date_str = ""

        writer.writerow([
            date_str,
            exp.get("title", ""),
            f"{exp.get('amount_minor', 0) / 100:.2f}",
            paid_by_name,
            exp.get("split_type", ""),
            exp.get("category", ""),
        ])

    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=group_{group_id}_expenses.csv"}
    )