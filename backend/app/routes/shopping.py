"""
Shared Shopping List routes (WebSocket + REST).

- REST GET/POST/PATCH/DELETE for items (standard CRUD).
- WebSocket endpoint at WS /groups/{group_id}/shopping/ws that
  broadcasts item changes to all connected clients in real-time.

Architecture: A simple in-memory pub/sub per group_id handles
  WebSocket broadcasts.  This is appropriate for a single-server
  deployment (which this project targets). In a multi-server setup,
  replace with Redis pub/sub.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field

from ..core.auth import get_current_user
from ..db.deps import get_db
from ..services.common_service import require_group_member
from ..utils.mongo_ids import oid, sid

router = APIRouter(prefix="/groups/{group_id}/shopping", tags=["shopping"])

# In-memory connection manager: group_id → set of active WebSocket connections
_connections: Dict[str, Set[WebSocket]] = {}


async def _broadcast(group_id: str, payload: dict) -> None:
    """Send a JSON message to all connected WebSocket clients in a group."""
    connections = _connections.get(group_id, set())
    dead: list[WebSocket] = []
    for ws in list(connections):
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.discard(ws)


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    quantity: Optional[str] = None     # e.g. "2 kg", "3 units"
    assigned_to: Optional[str] = None  # user_id string


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    quantity: Optional[str] = None
    checked: Optional[bool] = None
    assigned_to: Optional[str] = None


def _item_to_out(group_id: str, doc: dict) -> dict:
    return {
        "id": sid(doc["_id"]),
        "group_id": group_id,
        "name": doc["name"],
        "quantity": doc.get("quantity"),
        "checked": doc.get("checked", False),
        "assigned_to": sid(doc["assigned_to"]) if doc.get("assigned_to") else None,
        "added_by": sid(doc["added_by"]),
        "created_at": doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at"),
    }


@router.get("")
def list_items(
    group_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    docs = list(db["shopping_items"].find({"group_id": group_oid}).sort("_id", 1))
    return [_item_to_out(group_id, d) for d in docs]


@router.post("", status_code=201)
def add_item(
    group_id: str,
    payload: ItemCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    assigned_oid: Optional[ObjectId] = None
    if payload.assigned_to:
        assigned_oid = oid(payload.assigned_to)

    doc = {
        "group_id": group_oid,
        "name": payload.name,
        "quantity": payload.quantity,
        "checked": False,
        "assigned_to": assigned_oid,
        "added_by": me_oid,
        "created_at": datetime.now(timezone.utc),
    }
    result = db["shopping_items"].insert_one(doc)
    created = db["shopping_items"].find_one({"_id": result.inserted_id})
    return _item_to_out(group_id, created)


@router.patch("/{item_id}")
def update_item(
    group_id: str,
    item_id: str,
    payload: ItemUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    item_oid = oid(item_id)
    doc = db["shopping_items"].find_one({"_id": item_oid, "group_id": group_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")

    patch = payload.model_dump(exclude_unset=True)
    update: dict = {}
    if "name" in patch:
        update["name"] = patch["name"]
    if "quantity" in patch:
        update["quantity"] = patch["quantity"]
    if "checked" in patch:
        update["checked"] = patch["checked"]
    if "assigned_to" in patch:
        update["assigned_to"] = oid(patch["assigned_to"]) if patch["assigned_to"] else None

    if update:
        db["shopping_items"].update_one({"_id": item_oid}, {"$set": update})

    updated = db["shopping_items"].find_one({"_id": item_oid})
    return _item_to_out(group_id, updated)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    group_id: str,
    item_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    item_oid = oid(item_id)
    res = db["shopping_items"].delete_one({"_id": item_oid, "group_id": group_oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("")
def clear_checked(
    group_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Remove all checked items from the list."""
    group_oid = oid(group_id)
    me_oid = oid(current_user["id"])
    require_group_member(db, group_oid, me_oid)

    res = db["shopping_items"].delete_many({"group_id": group_oid, "checked": True})
    return {"deleted": res.deleted_count}


# ── WebSocket endpoint ──────────────────────────────────────────────────────
# Clients connect here to receive real-time item changes.
# On connect, send the current item list immediately.
@router.websocket("/ws")
async def shopping_ws(
    group_id: str,
    websocket: WebSocket,
    db=Depends(get_db),
):
    await websocket.accept()

    # Register this connection
    if group_id not in _connections:
        _connections[group_id] = set()
    _connections[group_id].add(websocket)

    try:
        # Send initial snapshot
        group_oid = oid(group_id)
        docs = list(db["shopping_items"].find({"group_id": group_oid}).sort("_id", 1))
        snapshot = [_item_to_out(group_id, d) for d in docs]
        await websocket.send_json({"type": "snapshot", "items": snapshot})

        # Keep connection alive; client sends ping or action events
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # Clients may send {"type":"ping"} for heartbeat
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    finally:
        _connections.get(group_id, set()).discard(websocket)
