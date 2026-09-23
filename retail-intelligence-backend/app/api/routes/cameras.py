"""Camera fleet endpoint — enrolment and health, no imagery."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import get_database, list_cameras, require_store

router = APIRouter(prefix="/cameras", tags=["cameras"])
logger = get_logger("routes.cameras")

HEALTH_STATES = {"online", "warning", "offline"}


@router.get("", summary="List enrolled cameras and their health")
async def cameras(
    store_id: str | None = Query(None, description="Omit to list every store"),
    camera_status: str | None = Query(None, alias="status", description="online | warning | offline"),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict[str, Any]:
    if camera_status and camera_status.lower() not in HEALTH_STATES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown camera status '{camera_status}'. Use one of: "
            + ", ".join(sorted(HEALTH_STATES)),
        )

    if store_id:
        await require_store(db, store_id)

    documents = await list_cameras(db, store_id, camera_status.lower() if camera_status else None)
    for document in documents:
        document.pop("_id", None)

    return {"total": len(documents), "items": documents}
