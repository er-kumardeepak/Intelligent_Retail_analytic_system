"""Event ingestion.

This is the seam between the edge AI pipeline and the rest of the backend: an
event is validated by Pydantic, stored once, then handed to whichever service
owns that event type. Services raise alerts and recommendations, and every
result is pushed to the dashboard over the store's WebSocket channel.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.api.websocket import manager
from app.core.config import get_logger, get_settings
from app.intelligence.prediction import build_queue_prediction
from app.intelligence.recommendations import (
    Recommendation,
    recommend_for_congestion,
    recommend_for_queue,
    recommend_for_shelves,
)
from app.models.alerts import Alert
from app.models.events import EventIn, EventIngestResult, EventOut, EventType
from app.models.shelves import ShelfStatus
from app.services import alert_service, metric_service, queue_service, shelf_service

logger = get_logger("event_service")

FOOTFALL_EVENT_TYPES = {EventType.PERSON_ENTERED, EventType.PERSON_EXITED}
SHELF_EVENT_TYPES = {
    EventType.SHELF_EMPTY,
    EventType.SHELF_LOW,
    EventType.SHELF_NORMAL,
}

# A recommendation of the same kind, for the same target, is re-sent at most this
# often. Keeps a sustained condition from flooding the dashboard. The process
# holds a single instance of this state; the MVP runs as one FastAPI process.
RECOMMENDATION_COOLDOWN_SECONDS = 120
_recent_recommendations: dict[str, float] = {}


def _recommendation_key(store_id: str, recommendation: Recommendation) -> str:
    target = (
        recommendation.context.get("shelf_id")
        or recommendation.context.get("zone")
        or recommendation.context.get("camera_id")
        or "store"
    )
    return f"{store_id}:{recommendation.type.value}:{target}"


def _filter_recommendations(
    store_id: str, recommendations: list[Recommendation]
) -> list[Recommendation]:
    """Drop recommendations that were already emitted within the cooldown."""
    now = datetime.now().timestamp()
    fresh: list[Recommendation] = []
    for recommendation in recommendations:
        key = _recommendation_key(store_id, recommendation)
        last_sent = _recent_recommendations.get(key)
        if last_sent is not None and now - last_sent < RECOMMENDATION_COOLDOWN_SECONDS:
            continue
        _recent_recommendations[key] = now
        fresh.append(recommendation)
    return fresh


async def _publish(store_id: str, message: dict[str, Any]) -> None:
    """Push one message to every dashboard watching this store."""
    await manager.broadcast(store_id, message)


async def ingest_event(db: AsyncIOMotorDatabase, event: EventIn) -> EventIngestResult:
    """Store an event and run the intelligence pass it triggers."""
    document = event.to_document()

    try:
        await db["events"].insert_one(document)
    except DuplicateKeyError:
        existing = await db["events"].find_one({"event_id": event.event_id})
        logger.info("Duplicate event %s ignored", event.event_id)
        return EventIngestResult(
            stored=False,
            duplicate=True,
            event=EventOut.model_validate(existing or document),
        )

    settings = get_settings()
    logger.info(
        "Event stored %s %s/%s confidence=%.2f",
        event.event_type.value,
        event.store_id,
        event.camera_id,
        event.confidence,
    )

    alerts: list[Alert] = []
    recommendations: list[Recommendation] = []

    if event.event_type in FOOTFALL_EVENT_TYPES:
        await metric_service.record_footfall_event(db, event)
        await _publish(
            event.store_id,
            {
                "type": "footfall_update",
                "store_id": event.store_id,
                "camera_id": event.camera_id,
                "direction": (
                    "in" if event.event_type is EventType.PERSON_ENTERED else "out"
                ),
                "timestamp": event.timestamp.isoformat(),
            },
        )

    elif event.event_type is EventType.QUEUE_UPDATE:
        state = await queue_service.record_queue_state(db, event)
        prediction = build_queue_prediction(
            state,
            horizon_minutes=settings.queue_prediction_minutes,
            breach_threshold=settings.predicted_queue_threshold,
        )
        alerts = await alert_service.evaluate_queue(
            db, state, prediction, related_event_id=event.event_id
        )
        recommendations = recommend_for_queue(
            state,
            prediction,
            queue_threshold=settings.queue_alert_threshold,
            predicted_threshold=settings.predicted_queue_threshold,
            related_event=event.event_id,
        )
        await _publish(
            event.store_id,
            {
                "type": "queue_update",
                "store_id": event.store_id,
                "camera_id": event.camera_id,
                "queue_length": state.queue_length,
                "open_counters": state.open_counters,
                "estimated_wait_minutes": prediction.estimated_wait_minutes,
                "predicted_queue": prediction.predicted_queue,
                "trend": prediction.trend,
                "timestamp": state.timestamp.isoformat(),
            },
        )

    elif event.event_type in SHELF_EVENT_TYPES:
        previous = await shelf_service.get_shelf_state(db, event.shelf_id or event.camera_id)
        state = await shelf_service.apply_shelf_event(db, event)
        alerts = await alert_service.evaluate_shelf(db, event)

        if state is not None:
            status_changed = previous is None or previous.status is not state.status
            if status_changed and state.status in {ShelfStatus.EMPTY, ShelfStatus.LOW}:
                recommendations = recommend_for_shelves(
                    event.store_id, [state], related_event=event.event_id
                )
            await _publish(
                event.store_id,
                {
                    "type": "shelf_update",
                    "store_id": event.store_id,
                    "shelf_id": state.shelf_id,
                    "camera_id": state.camera_id,
                    "status": state.status.value,
                    "confidence": state.confidence,
                    "changed": status_changed,
                    "timestamp": state.last_detected.isoformat(),
                },
            )

    elif event.event_type is EventType.CONGESTION_PREDICTED:
        alerts = await alert_service.evaluate_congestion(db, event)
        recommendations = recommend_for_congestion(
            event.store_id,
            str(event.data.get("level") or "warning"),
            event.data,
            related_event=event.event_id,
            timestamp=event.timestamp,
        )

    else:
        # zone_entered / zone_exited / counter_opened / counter_closed are stored
        # and broadcast; they carry no threshold rule in the MVP.
        await _publish(
            event.store_id,
            {
                "type": "event",
                "store_id": event.store_id,
                "event_type": event.event_type.value,
                "camera_id": event.camera_id,
                "timestamp": event.timestamp.isoformat(),
            },
        )

    fresh_recommendations = _filter_recommendations(event.store_id, recommendations)

    for alert in alerts:
        await _publish(
            event.store_id,
            {
                "type": "alert",
                "store_id": event.store_id,
                "alert": alert.model_dump(mode="json"),
            },
        )

    for recommendation in fresh_recommendations:
        await _publish(
            event.store_id,
            {
                "type": "recommendation",
                "store_id": event.store_id,
                "recommendation": recommendation.model_dump(mode="json"),
            },
        )

    return EventIngestResult(
        stored=True,
        duplicate=False,
        event=EventOut.model_validate(document),
        alerts_created=[alert.model_dump(mode="json") for alert in alerts],
        recommendations=[
            recommendation.model_dump(mode="json") for recommendation in fresh_recommendations
        ],
    )


async def list_events(
    db: AsyncIOMotorDatabase,
    *,
    store_id: str | None = None,
    camera_id: str | None = None,
    event_type: EventType | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[int, list[EventOut]]:
    """Paged event search. Returns (total matching, page of events)."""
    query: dict[str, Any] = {}
    if store_id:
        query["store_id"] = store_id
    if camera_id:
        query["camera_id"] = camera_id
    if event_type:
        query["event_type"] = event_type.value
    if start or end:
        window: dict[str, Any] = {}
        if start:
            window["$gte"] = start
        if end:
            window["$lte"] = end
        query["timestamp"] = window

    total = await db["events"].count_documents(query)
    cursor = (
        db["events"].find(query).sort("timestamp", -1).skip(offset).limit(limit)
    )
    documents = [document async for document in cursor]
    return total, [EventOut.model_validate(document) for document in documents]


async def recent_event_type_counts(
    db: AsyncIOMotorDatabase, store_id: str, start: datetime, end: datetime
) -> dict[str, int]:
    """Event volume per type — the pipeline's own health indicator."""
    pipeline: list[dict[str, Any]] = [
        {"$match": {"store_id": store_id, "timestamp": {"$gte": start, "$lte": end}}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
    ]
    cursor = db["events"].aggregate(pipeline)
    return {row["_id"]: int(row["count"]) async for row in cursor}
