"""Alert lifecycle: raise, deduplicate, list, acknowledge, resolve.

Alerts come from deterministic thresholds, so each one stores the numbers that
triggered it in ``context``. A short dedupe window keeps a sustained condition
(a queue that stays long for twenty minutes) from creating forty alerts.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.core.config import get_logger, get_settings
from app.core.database import utcnow
from app.models.alerts import (
    Alert,
    AlertCreate,
    AlertList,
    AlertSeverity,
    AlertStatus,
    AlertType,
)
from app.models.events import EventIn, EventType
from app.models.queues import QueuePrediction, QueueState
from app.models.shelves import ShelfState, ShelfStatus
from app.services import shelf_service

logger = get_logger("alert_service")

# A condition that persists re-arms after this long.
DEDUPE_WINDOW_MINUTES = 10


def _alert_id() -> str:
    return f"alt_{uuid4().hex}"


def _from_document(document: dict[str, Any]) -> Alert:
    return Alert.model_validate(document)


def severity_for_ratio(value: int, threshold: int) -> AlertSeverity:
    """Escalate severity once a condition runs well past its threshold."""
    if threshold > 0 and value >= threshold * 1.5:
        return AlertSeverity.CRITICAL
    if value >= threshold:
        return AlertSeverity.WARNING
    return AlertSeverity.INFO


async def create_alert(
    db: AsyncIOMotorDatabase, payload: AlertCreate
) -> Alert | None:
    """Insert an alert unless an equivalent one is already active.

    Returns None when suppressed as a duplicate.
    """
    timestamp = payload.timestamp or utcnow()

    duplicate_filter: dict[str, Any] = {
        "store_id": payload.store_id,
        "type": payload.type.value,
        "status": {"$in": [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]},
        "timestamp": {"$gte": timestamp - timedelta(minutes=DEDUPE_WINDOW_MINUTES)},
    }
    if payload.shelf_id:
        duplicate_filter["shelf_id"] = payload.shelf_id
    if payload.camera_id:
        duplicate_filter["camera_id"] = payload.camera_id

    existing = await db["alerts"].find_one(duplicate_filter)
    if existing:
        logger.info(
            "Alert suppressed as duplicate (%s/%s) within %d min",
            payload.store_id,
            payload.type.value,
            DEDUPE_WINDOW_MINUTES,
        )
        return None

    alert = Alert(
        alert_id=_alert_id(),
        store_id=payload.store_id,
        type=payload.type,
        severity=payload.severity,
        message=payload.message,
        timestamp=timestamp,
        status=AlertStatus.ACTIVE,
        camera_id=payload.camera_id,
        shelf_id=payload.shelf_id,
        related_event_id=payload.related_event_id,
        context=payload.context,
    )
    document = alert.model_dump()
    document["created_at"] = utcnow()
    await db["alerts"].insert_one(document)

    logger.info(
        "Alert created %s [%s/%s] %s",
        alert.alert_id,
        alert.severity.value,
        alert.type.value,
        alert.message,
    )
    return alert


async def list_alerts(
    db: AsyncIOMotorDatabase,
    *,
    store_id: str | None = None,
    status: AlertStatus | None = None,
    severity: AlertSeverity | None = None,
    alert_type: AlertType | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AlertList:
    query: dict[str, Any] = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status.value
    if severity:
        query["severity"] = severity.value
    if alert_type:
        query["type"] = alert_type.value

    total = await db["alerts"].count_documents(query)
    cursor = (
        db["alerts"].find(query).sort("timestamp", -1).skip(offset).limit(limit)
    )
    documents = [document async for document in cursor]

    return AlertList(
        total=total,
        count=len(documents),
        limit=limit,
        offset=offset,
        items=[_from_document(document) for document in documents],
    )


async def get_active_alerts(
    db: AsyncIOMotorDatabase, store_id: str, limit: int = 20
) -> list[Alert]:
    cursor = (
        db["alerts"]
        .find(
            {
                "store_id": store_id,
                "status": {"$in": [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]},
            }
        )
        .sort("timestamp", -1)
        .limit(limit)
    )
    return [Alert.model_validate(document) async for document in cursor]


async def _set_status(
    db: AsyncIOMotorDatabase,
    alert_id: str,
    status: AlertStatus,
    note: str | None,
) -> Alert | None:
    now = utcnow()
    update: dict[str, Any] = {"$set": {"status": status.value}}
    if status is AlertStatus.ACKNOWLEDGED:
        update["$set"]["acknowledged_at"] = now
    if status is AlertStatus.RESOLVED:
        update["$set"]["resolved_at"] = now
        update["$set"]["resolution_note"] = note

    result = await db["alerts"].find_one_and_update(
        {"alert_id": alert_id}, update, return_document=True
    )
    if result is None:
        logger.warning("Alert %s not found for status change to %s", alert_id, status.value)
        return None

    logger.info("Alert %s -> %s", alert_id, status.value)
    return _from_document(result)


async def acknowledge_alert(
    db: AsyncIOMotorDatabase, alert_id: str, note: str | None = None
) -> Alert | None:
    return await _set_status(db, alert_id, AlertStatus.ACKNOWLEDGED, note)


async def resolve_alert(
    db: AsyncIOMotorDatabase, alert_id: str, note: str | None = None
) -> Alert | None:
    return await _set_status(db, alert_id, AlertStatus.RESOLVED, note)


async def active_alert_status_by_shelf(
    db: AsyncIOMotorDatabase, shelf_ids: list[str]
) -> dict[str, AlertStatus]:
    """Map shelf id -> alert status, for the shelf list endpoint."""
    if not shelf_ids:
        return {}
    cursor = db["alerts"].find(
        {
            "shelf_id": {"$in": shelf_ids},
            "status": {"$in": [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]},
        }
    )
    statuses: dict[str, AlertStatus] = {}
    async for document in cursor:
        shelf_id = document.get("shelf_id")
        if shelf_id:
            statuses[shelf_id] = AlertStatus(document.get("status", AlertStatus.ACTIVE.value))
    return statuses


async def attach_shelf_alert_status(
    db: AsyncIOMotorDatabase, shelves: list[ShelfState]
) -> list[ShelfState]:
    """Annotate shelf states with their open alert, for the shelves endpoint."""
    statuses = await active_alert_status_by_shelf(db, [shelf.shelf_id for shelf in shelves])
    for shelf in shelves:
        shelf.alert_status = statuses.get(shelf.shelf_id)
    return shelves


# --------------------------------------------------------------------------- #
# Rule evaluation
# --------------------------------------------------------------------------- #
async def evaluate_queue(
    db: AsyncIOMotorDatabase,
    state: QueueState,
    prediction: QueuePrediction,
    *,
    related_event_id: str | None = None,
) -> list[Alert]:
    """Threshold rules over the current queue and its projection."""
    settings = get_settings()
    created: list[Alert] = []

    if state.queue_length >= settings.queue_alert_threshold:
        alert = await create_alert(
            db,
            AlertCreate(
                store_id=state.store_id,
                type=AlertType.QUEUE_THRESHOLD_EXCEEDED,
                severity=severity_for_ratio(
                    state.queue_length, settings.queue_alert_threshold
                ),
                message=(
                    f"Queue at {state.camera_id} reached {state.queue_length} people "
                    f"(threshold {settings.queue_alert_threshold})."
                ),
                camera_id=state.camera_id,
                related_event_id=related_event_id,
                context={
                    "queue_length": state.queue_length,
                    "threshold": settings.queue_alert_threshold,
                    "open_counters": state.open_counters,
                    "estimated_wait_minutes": prediction.estimated_wait_minutes,
                    "rule": "queue_length >= queue_alert_threshold",
                },
                timestamp=state.timestamp,
            ),
        )
        if alert:
            created.append(alert)

    if prediction.predicted_queue >= settings.predicted_queue_threshold:
        alert = await create_alert(
            db,
            AlertCreate(
                store_id=state.store_id,
                type=AlertType.PREDICTED_QUEUE_THRESHOLD_EXCEEDED,
                severity=severity_for_ratio(
                    prediction.predicted_queue, settings.predicted_queue_threshold
                ),
                message=(
                    f"Queue projected to reach {prediction.predicted_queue} in "
                    f"{prediction.horizon_minutes} minutes (threshold "
                    f"{settings.predicted_queue_threshold})."
                ),
                camera_id=state.camera_id,
                related_event_id=related_event_id,
                context={
                    "predicted_queue": prediction.predicted_queue,
                    "current_queue": state.queue_length,
                    "horizon_minutes": prediction.horizon_minutes,
                    "net_growth_per_minute": prediction.net_growth_per_minute,
                    "formula": prediction.formula,
                    "rule": "predicted_queue >= predicted_queue_threshold",
                },
                timestamp=state.timestamp,
            ),
        )
        if alert:
            created.append(alert)

    return created


async def evaluate_shelf(db: AsyncIOMotorDatabase, event: EventIn) -> list[Alert]:
    """Shelf rules: empty bays are critical, low bays are warnings."""
    if shelf_service.is_low_confidence(event):
        logger.info(
            "Shelf alert skipped for %s: confidence %.2f below threshold",
            event.camera_id,
            event.confidence,
        )
        return []

    shelf_id = event.shelf_id or event.camera_id
    if event.event_type is EventType.SHELF_EMPTY:
        alert_type, severity = AlertType.SHELF_EMPTY, AlertSeverity.CRITICAL
        message = f"Shelf {shelf_id} is empty — replenishment required."
    elif event.event_type is EventType.SHELF_LOW:
        alert_type, severity = AlertType.SHELF_LOW, AlertSeverity.WARNING
        message = f"Shelf {shelf_id} is running low."
    else:
        # shelf_normal clears the condition rather than raising anything.
        await resolve_shelf_alerts(db, shelf_id)
        return []

    alert = await create_alert(
        db,
        AlertCreate(
            store_id=event.store_id,
            type=alert_type,
            severity=severity,
            message=message,
            camera_id=event.camera_id,
            shelf_id=shelf_id,
            related_event_id=event.event_id,
            context={
                "confidence": event.confidence,
                "detected_by": event.camera_id,
                "rule": f"event_type == {event.event_type.value}",
            },
            timestamp=event.timestamp,
        ),
    )
    return [alert] if alert else []


async def resolve_shelf_alerts(db: AsyncIOMotorDatabase, shelf_id: str) -> int:
    """Auto-resolve open shelf alerts once the bay is restocked."""
    try:
        result = await db["alerts"].update_many(
            {
                "shelf_id": shelf_id,
                "type": {"$in": [AlertType.SHELF_EMPTY.value, AlertType.SHELF_LOW.value]},
                "status": {"$in": [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]},
            },
            {
                "$set": {
                    "status": AlertStatus.RESOLVED.value,
                    "resolved_at": utcnow(),
                    "resolution_note": "Auto-resolved: shelf reported normal.",
                }
            },
        )
    except PyMongoError as exc:  # pragma: no cover - depends on the environment
        logger.warning("Could not auto-resolve shelf alerts: %s", exc)
        return 0
    if result.modified_count:
        logger.info("Auto-resolved %d alert(s) for shelf %s", result.modified_count, shelf_id)
    return result.modified_count


async def evaluate_congestion(
    db: AsyncIOMotorDatabase, event: EventIn
) -> list[Alert]:
    """Alert raised when the edge AI reports a congestion prediction."""
    level = str(event.data.get("level") or event.data.get("predicted_level") or "warning").lower()
    severity = {
        "critical": AlertSeverity.CRITICAL,
        "warning": AlertSeverity.WARNING,
    }.get(level, AlertSeverity.INFO)

    zone = event.data.get("zone") or event.data.get("zone_id") or event.camera_id
    horizon = event.data.get("horizon_minutes") or event.data.get("minutes")

    alert = await create_alert(
        db,
        AlertCreate(
            store_id=event.store_id,
            type=AlertType.CONGESTION,
            severity=severity,
            message=(
                f"Congestion predicted at {zone}"
                + (f" within {horizon} minutes." if horizon else ".")
            ),
            camera_id=event.camera_id,
            related_event_id=event.event_id,
            context={
                "level": level,
                "zone": zone,
                "payload": event.data,
                "rule": "event_type == congestion_predicted",
            },
            timestamp=event.timestamp,
        ),
    )
    return [alert] if alert else []


async def count_active(db: AsyncIOMotorDatabase, store_id: str) -> int:
    return await db["alerts"].count_documents(
        {"store_id": store_id, "status": AlertStatus.ACTIVE.value}
    )
