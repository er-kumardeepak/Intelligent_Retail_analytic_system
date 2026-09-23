"""Event ingestion and search.

POST is the only write path the edge device needs; GET exists so the pipeline can
be inspected and debugged from the dashboard.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import get_camera, get_database, get_store
from app.models.events import EventIn, EventIngestResult, EventList, EventType
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])
logger = get_logger("routes.events")


@router.post(
    "",
    response_model=EventIngestResult,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest one detection from the edge AI pipeline",
)
async def create_event(
    event: EventIn,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> EventIngestResult:
    store = await get_store(db, event.store_id)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{event.store_id}' is not registered with this backend.",
        )

    camera = await get_camera(db, event.camera_id)
    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera '{event.camera_id}' is not enrolled for any store.",
        )

    camera_store = camera.get("store_id")
    if camera_store and camera_store != event.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Camera '{event.camera_id}' belongs to store '{camera_store}', "
                f"not '{event.store_id}'."
            ),
        )

    return await event_service.ingest_event(db, event)


@router.get("", response_model=EventList, summary="Search the event log")
async def list_events(
    store_id: str | None = Query(None),
    camera_id: str | None = Query(None),
    event_type: EventType | None = Query(None),
    start: datetime | None = Query(None, description="ISO timestamp, inclusive"),
    end: datetime | None = Query(None, description="ISO timestamp, inclusive"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> EventList:
    total, items = await event_service.list_events(
        db,
        store_id=store_id,
        camera_id=camera_id,
        event_type=event_type,
        start=start,
        end=end,
        limit=limit,
        offset=offset,
    )
    return EventList(
        total=total, count=len(items), limit=limit, offset=offset, items=items
    )
