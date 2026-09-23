"""Shelf endpoints: availability per bay, with the open alert attached."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import get_database, require_store
from app.models.shelves import ShelfSummary
from app.services import alert_service, shelf_service

router = APIRouter(prefix="/stores/{store_id}", tags=["shelves"])
logger = get_logger("routes.shelves")


@router.get(
    "/shelves",
    response_model=ShelfSummary,
    summary="Latest state of every shelf bay in a store",
)
async def store_shelves(
    store_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ShelfSummary:
    await require_store(db, store_id)

    summary = await shelf_service.get_shelf_summary(db, store_id)
    # Annotate each bay with its live alert so the dashboard needs no join.
    await alert_service.attach_shelf_alert_status(db, summary.items)
    return summary
