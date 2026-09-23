"""Recommendation engine — deterministic rules for the MVP.

No LLM is involved: every recommendation is produced by a rule that can be read
in the source, states the numbers it reacted to in ``context``, and links back to
the event or state that triggered it.

Priority ladder (highest first): critical > high > medium > low.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Iterable, Sequence
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from app.models.queues import QueuePrediction, QueueState
from app.models.shelves import ShelfState, ShelfStatus


class RecommendationType(str, Enum):
    OPEN_COUNTER = "open_counter"
    ASSIGN_STAFF = "assign_staff"
    REPLENISH_SHELF = "replenish_shelf"
    CHECK_SHELF = "check_shelf"
    MONITOR_CONGESTION = "monitor_congestion"
    BALANCE_COUNTERS = "balance_counters"
    CAMERA_MAINTENANCE = "camera_maintenance"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Recommendation(BaseModel):
    """A single suggested action for store staff."""

    model_config = ConfigDict(extra="ignore")

    recommendation_id: str
    store_id: str
    type: RecommendationType
    message: str
    priority: Priority
    timestamp: datetime
    related_event: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _make(
    store_id: str,
    rec_type: RecommendationType,
    message: str,
    priority: Priority,
    *,
    related_event: str | None = None,
    context: dict[str, Any] | None = None,
    timestamp: datetime | None = None,
) -> Recommendation:
    return Recommendation(
        recommendation_id=f"rec_{uuid4().hex}",
        store_id=store_id,
        type=rec_type,
        message=message,
        priority=priority,
        timestamp=timestamp or _now(),
        related_event=related_event,
        context=context or {},
    )


def recommend_for_queue(
    state: QueueState,
    prediction: QueuePrediction,
    *,
    queue_threshold: int = 5,
    predicted_threshold: int = 8,
    related_event: str | None = None,
) -> list[Recommendation]:
    """Rules reacting to the current queue and its projection."""
    recommendations: list[Recommendation] = []
    store_id = state.store_id

    if prediction.predicted_queue >= predicted_threshold and state.open_counters <= 2:
        recommendations.append(
            _make(
                store_id,
                RecommendationType.OPEN_COUNTER,
                "Consider opening another checkout counter.",
                Priority.CRITICAL if prediction.predicted_queue >= predicted_threshold * 1.5 else Priority.HIGH,
                related_event=related_event,
                context={
                    "current_queue": state.queue_length,
                    "predicted_queue": prediction.predicted_queue,
                    "horizon_minutes": prediction.horizon_minutes,
                    "open_counters": state.open_counters,
                    "rule": "predicted_queue >= predicted_threshold and open_counters <= 2",
                },
                timestamp=state.timestamp,
            )
        )

    if prediction.trend == "growing" and state.queue_length >= max(2, queue_threshold - 2):
        recommendations.append(
            _make(
                store_id,
                RecommendationType.ASSIGN_STAFF,
                "Queue congestion is increasing. Consider assigning additional staff.",
                Priority.HIGH if prediction.net_growth_per_minute >= 0.5 else Priority.MEDIUM,
                related_event=related_event,
                context={
                    "net_growth_per_minute": prediction.net_growth_per_minute,
                    "arrival_rate": state.arrival_rate,
                    "service_rate": state.service_rate,
                    "rule": "trend == growing and queue_length approaching threshold",
                },
                timestamp=state.timestamp,
            )
        )

    if state.queue_length >= queue_threshold:
        recommendations.append(
            _make(
                store_id,
                RecommendationType.BALANCE_COUNTERS,
                "Route arriving customers to the shortest lane while the queue drains.",
                Priority.HIGH if state.queue_length >= queue_threshold * 1.5 else Priority.MEDIUM,
                related_event=related_event,
                context={
                    "queue_length": state.queue_length,
                    "threshold": queue_threshold,
                    "estimated_wait_minutes": prediction.estimated_wait_minutes,
                    "rule": "queue_length >= queue_threshold",
                },
                timestamp=state.timestamp,
            )
        )

    if state.open_counters == 0 and state.queue_length > 0:
        recommendations.append(
            _make(
                store_id,
                RecommendationType.OPEN_COUNTER,
                "No checkout counter is open while customers are waiting.",
                Priority.CRITICAL,
                related_event=related_event,
                context={"queue_length": state.queue_length, "rule": "open_counters == 0"},
                timestamp=state.timestamp,
            )
        )

    return recommendations


def recommend_for_shelves(
    store_id: str,
    shelves: Iterable[ShelfState],
    *,
    related_event: str | None = None,
) -> list[Recommendation]:
    """Rules reacting to shelf state: empty bays first, then low bays."""
    recommendations: list[Recommendation] = []

    for shelf in shelves:
        if shelf.status is ShelfStatus.EMPTY:
            recommendations.append(
                _make(
                    store_id,
                    RecommendationType.REPLENISH_SHELF,
                    f"Replenishment required for shelf {shelf.shelf_id}.",
                    Priority.CRITICAL,
                    related_event=related_event,
                    context={
                        "shelf_id": shelf.shelf_id,
                        "camera_id": shelf.camera_id,
                        "confidence": shelf.confidence,
                        "last_detected": shelf.last_detected.isoformat(),
                        "rule": "status == empty",
                    },
                    timestamp=shelf.last_detected,
                )
            )
        elif shelf.status is ShelfStatus.LOW:
            recommendations.append(
                _make(
                    store_id,
                    RecommendationType.CHECK_SHELF,
                    f"Check shelf {shelf.shelf_id} and replenish stock soon.",
                    Priority.MEDIUM,
                    related_event=related_event,
                    context={
                        "shelf_id": shelf.shelf_id,
                        "camera_id": shelf.camera_id,
                        "confidence": shelf.confidence,
                        "last_detected": shelf.last_detected.isoformat(),
                        "rule": "status == low",
                    },
                    timestamp=shelf.last_detected,
                )
            )

    return recommendations


def recommend_for_cameras(
    store_id: str,
    cameras: Sequence[dict[str, Any]],
) -> list[Recommendation]:
    """Offline cameras blind the pipeline, so they are worth surfacing."""
    recommendations: list[Recommendation] = []
    for camera in cameras:
        if str(camera.get("status", "")).lower() != "offline":
            continue
        camera_id = str(camera.get("camera_id", "unknown"))
        zone = camera.get("zone") or "unassigned zone"
        recommendations.append(
            _make(
                store_id,
                RecommendationType.CAMERA_MAINTENANCE,
                f"Restore camera {camera_id}: {zone} is currently unwatched.",
                Priority.HIGH,
                context={
                    "camera_id": camera_id,
                    "zone": zone,
                    "last_frame": camera.get("last_frame_at"),
                    "rule": "camera status == offline",
                },
            )
        )
    return recommendations


def recommend_for_congestion(
    store_id: str,
    predicted_level: str,
    payload: dict[str, Any],
    *,
    related_event: str | None = None,
    timestamp: datetime | None = None,
) -> list[Recommendation]:
    """Rule used when the edge AI itself reports a congestion prediction."""
    level = predicted_level.lower()
    priority = {
        "critical": Priority.CRITICAL,
        "warning": Priority.HIGH,
        "watch": Priority.MEDIUM,
    }.get(level, Priority.LOW)

    zone = payload.get("zone") or payload.get("zone_id") or "checkout"
    minutes = payload.get("horizon_minutes") or payload.get("minutes")
    horizon = f" in about {minutes} minutes" if minutes else " shortly"

    return [
        _make(
            store_id,
            RecommendationType.MONITOR_CONGESTION,
            f"Congestion predicted at {zone}{horizon}. Pre-empt it before it forms.",
            priority,
            related_event=related_event,
            context={
                "predicted_level": level,
                "zone": zone,
                "payload": payload,
                "rule": "congestion_predicted event received from edge",
            },
            timestamp=timestamp,
        )
    ]


def sort_recommendations(recommendations: Sequence[Recommendation]) -> list[Recommendation]:
    """Most urgent first, then newest first. Stable for identical priorities."""
    order = {
        Priority.CRITICAL: 0,
        Priority.HIGH: 1,
        Priority.MEDIUM: 2,
        Priority.LOW: 3,
    }
    return sorted(
        recommendations,
        key=lambda rec: (order[rec.priority], -rec.timestamp.timestamp()),
    )
