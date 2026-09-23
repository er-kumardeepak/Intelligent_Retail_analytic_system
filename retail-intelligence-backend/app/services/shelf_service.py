"""Shelf intelligence service.

One document per shelf in ``shelf_states``, always the latest known state. The
event log keeps the history, so this collection stays small and cheap to read.
"""

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger, get_settings
from app.core.database import utcnow
from app.models.events import EventIn, EventType
from app.models.shelves import ShelfState, ShelfStatus, ShelfSummary

logger = get_logger("shelf_service")

STATUS_BY_EVENT: dict[EventType, ShelfStatus] = {
    EventType.SHELF_EMPTY: ShelfStatus.EMPTY,
    EventType.SHELF_LOW: ShelfStatus.LOW,
    EventType.SHELF_NORMAL: ShelfStatus.NORMAL,
}

SHELF_EVENT_TYPES = tuple(event_type.value for event_type in STATUS_BY_EVENT)


def _state_from_document(document: dict[str, Any]) -> ShelfState:
    return ShelfState(
        shelf_id=document["shelf_id"],
        store_id=document["store_id"],
        camera_id=document["camera_id"],
        status=ShelfStatus(document.get("status", ShelfStatus.UNKNOWN.value)),
        confidence=float(document.get("confidence") or 0.0),
        last_detected=document["last_detected"],
        alert_status=document.get("alert_status"),
        low_events=int(document.get("low_events") or 0),
        empty_events=int(document.get("empty_events") or 0),
    )


async def apply_shelf_event(
    db: AsyncIOMotorDatabase, event: EventIn
) -> ShelfState | None:
    """Upsert the shelf state implied by a shelf detection event."""
    status = STATUS_BY_EVENT.get(event.event_type)
    shelf_id = event.shelf_id
    if status is None or shelf_id is None:
        logger.warning(
            "Shelf event %s from %s carried no usable shelf id", event.event_type.value, event.camera_id
        )
        return None

    increments = {
        ShelfStatus.LOW: {"low_events": 1},
        ShelfStatus.EMPTY: {"empty_events": 1},
    }.get(status, {})

    await db["shelf_states"].update_one(
        {"shelf_id": shelf_id},
        {
            "$set": {
                "shelf_id": shelf_id,
                "store_id": event.store_id,
                "camera_id": event.camera_id,
                "status": status.value,
                "confidence": event.confidence,
                "last_detected": event.timestamp,
                "updated_at": utcnow(),
            },
            "$inc": increments,
        },
        upsert=True,
    )

    logger.info(
        "Shelf %s -> %s (confidence %.2f, camera %s)",
        shelf_id,
        status.value,
        event.confidence,
        event.camera_id,
    )
    return await get_shelf_state(db, shelf_id)


async def get_shelf_state(
    db: AsyncIOMotorDatabase, shelf_id: str
) -> ShelfState | None:
    document = await db["shelf_states"].find_one({"shelf_id": shelf_id})
    return _state_from_document(document) if document else None


async def list_shelf_states(
    db: AsyncIOMotorDatabase, store_id: str
) -> list[ShelfState]:
    """All shelves for a store, most recently detected first."""
    cursor = db["shelf_states"].find({"store_id": store_id}).sort("last_detected", -1)
    return [_state_from_document(document) async for document in cursor]


async def get_shelf_summary(db: AsyncIOMotorDatabase, store_id: str) -> ShelfSummary:
    """Availability rolled up for the dashboard, with alert status attached."""
    shelves = await list_shelf_states(db, store_id)

    counts = {status: 0 for status in ShelfStatus}
    for shelf in shelves:
        counts[shelf.status] += 1

    known = len(shelves) - counts[ShelfStatus.UNKNOWN]
    availability = round((counts[ShelfStatus.NORMAL] / known) * 100, 1) if known else 0.0

    return ShelfSummary(
        store_id=store_id,
        total_shelves=len(shelves),
        normal=counts[ShelfStatus.NORMAL],
        low=counts[ShelfStatus.LOW],
        empty=counts[ShelfStatus.EMPTY],
        unknown=counts[ShelfStatus.UNKNOWN],
        availability_percentage=availability,
        shelves_needing_attention=counts[ShelfStatus.EMPTY] + counts[ShelfStatus.LOW],
        items=shelves,
    )


def is_low_confidence(event: EventIn) -> bool:
    """True when a detection is too weak to act on."""
    return event.confidence < get_settings().shelf_low_confidence_threshold
