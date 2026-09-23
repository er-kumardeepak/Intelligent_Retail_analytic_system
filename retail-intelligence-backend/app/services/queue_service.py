"""Queue intelligence service: store snapshots, summarise them, project forward."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger, get_settings
from app.core.database import utcnow
from app.intelligence.prediction import build_queue_prediction, estimate_wait_minutes
from app.models.events import EventIn
from app.models.metrics import TimeWindow
from app.models.queues import QueuePrediction, QueueState, QueueSummary
from app.services import metric_service

logger = get_logger("queue_service")

# Cap on the chart series returned with a summary — enough for a shift view.
SERIES_LIMIT = 120


def _state_from_document(document: dict[str, Any]) -> QueueState:
    return QueueState(
        store_id=document["store_id"],
        camera_id=document["camera_id"],
        queue_length=int(document.get("queue_length") or 0),
        arrival_rate=float(document.get("arrival_rate") or 0.0),
        service_rate=float(document.get("service_rate") or 0.0),
        open_counters=int(document.get("open_counters") or 0),
        timestamp=document["timestamp"],
        event_id=document.get("event_id"),
    )


async def record_queue_state(db: AsyncIOMotorDatabase, event: EventIn) -> QueueState:
    """Persist one queue snapshot from a ``queue_update`` event."""
    state = QueueState(
        store_id=event.store_id,
        camera_id=event.camera_id,
        queue_length=int(event.data["queue_length"]),
        arrival_rate=float(event.data.get("arrival_rate") or 0.0),
        service_rate=float(event.data.get("service_rate") or 0.0),
        open_counters=int(event.data.get("open_counters") or 1),
        timestamp=event.timestamp,
        event_id=event.event_id,
    )
    document = state.model_dump()
    document["received_at"] = utcnow()
    await db["queue_states"].insert_one(document)

    logger.info(
        "Queue snapshot %s/%s: length=%s arrival=%s service=%s counters=%s",
        state.store_id,
        state.camera_id,
        state.queue_length,
        state.arrival_rate,
        state.service_rate,
        state.open_counters,
    )
    return state


async def get_latest_queue_state(
    db: AsyncIOMotorDatabase, store_id: str
) -> QueueState | None:
    """Most recent snapshot for a store, or None when nothing has arrived yet."""
    document = await db["queue_states"].find_one(
        {"store_id": store_id}, sort=[("timestamp", -1)]
    )
    return _state_from_document(document) if document else None


async def list_queue_history(
    db: AsyncIOMotorDatabase, store_id: str, limit: int = SERIES_LIMIT
) -> list[QueueState]:
    cursor = (
        db["queue_states"]
        .find({"store_id": store_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    documents = [document async for document in cursor]
    return [_state_from_document(document) for document in reversed(documents)]


async def get_queue_summary(
    db: AsyncIOMotorDatabase,
    store_id: str,
    window: TimeWindow = TimeWindow.TODAY,
    start: datetime | None = None,
    end: datetime | None = None,
) -> QueueSummary:
    """Current queue plus peak/average over the requested window."""
    resolved_start, resolved_end = metric_service.resolve_window(window, start, end)

    pipeline: list[dict[str, Any]] = [
        {
            "$match": {
                "store_id": store_id,
                "timestamp": {"$gte": resolved_start, "$lte": resolved_end},
            }
        },
        {
            "$group": {
                "_id": None,
                "peak_queue": {"$max": "$queue_length"},
                "average_queue": {"$avg": "$queue_length"},
                "samples": {"$sum": 1},
            }
        },
    ]
    cursor = db["queue_states"].aggregate(pipeline)
    rows = [row async for row in cursor]
    aggregate = rows[0] if rows else {}

    latest = await get_latest_queue_state(db, store_id)
    history = await list_queue_history(db, store_id)

    return QueueSummary(
        store_id=store_id,
        current_queue=latest.queue_length if latest else 0,
        open_counters=latest.open_counters if latest else 0,
        arrival_rate=latest.arrival_rate if latest else 0.0,
        service_rate=latest.service_rate if latest else 0.0,
        estimated_wait_minutes=(
            estimate_wait_minutes(latest.queue_length, latest.service_rate, latest.open_counters)
            if latest
            else 0.0
        ),
        peak_queue=int(aggregate.get("peak_queue") or 0),
        average_queue=round(float(aggregate.get("average_queue") or 0.0), 2),
        samples=int(aggregate.get("samples") or 0),
        last_updated=latest.timestamp if latest else None,
        series=[
            {
                "timestamp": state.timestamp,
                "queue_length": state.queue_length,
                "arrival_rate": state.arrival_rate,
                "service_rate": state.service_rate,
                "open_counters": state.open_counters,
            }
            for state in history
        ],
    )


async def get_queue_prediction(
    db: AsyncIOMotorDatabase,
    store_id: str,
    horizon_minutes: int | None = None,
    breach_threshold: int | None = None,
) -> QueuePrediction | None:
    """Project the latest queue forward. Returns None when no snapshot exists."""
    latest = await get_latest_queue_state(db, store_id)
    if latest is None:
        logger.info("Queue prediction requested for %s but no snapshot exists", store_id)
        return None

    settings = get_settings()
    prediction = build_queue_prediction(
        latest,
        horizon_minutes=horizon_minutes or settings.queue_prediction_minutes,
        breach_threshold=breach_threshold or settings.predicted_queue_threshold,
    )
    logger.info(
        "Queue prediction %s: current=%s predicted=%s in %s min (%s)",
        store_id,
        prediction.current_queue,
        prediction.predicted_queue,
        prediction.horizon_minutes,
        prediction.congestion_level,
    )
    return prediction
