"""Alert models.

Alerts are raised by deterministic rules, so each one carries the message and a
small ``context`` block explaining the numbers behind it. Severity maps onto the
dashboard's critical / warning / info colour language.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertType(str, Enum):
    SHELF_EMPTY = "shelf_empty"
    SHELF_LOW = "shelf_low"
    QUEUE_THRESHOLD_EXCEEDED = "queue_threshold_exceeded"
    PREDICTED_QUEUE_THRESHOLD_EXCEEDED = "predicted_queue_threshold_exceeded"
    CONGESTION = "congestion"
    CAMERA_OFFLINE = "camera_offline"


class Alert(BaseModel):
    """An alert document (``alerts`` collection) and its API representation."""

    model_config = ConfigDict(extra="ignore")

    alert_id: str
    store_id: str
    type: AlertType
    severity: AlertSeverity
    message: str
    timestamp: datetime
    status: AlertStatus = AlertStatus.ACTIVE

    camera_id: str | None = None
    shelf_id: str | None = None
    related_event_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)

    acknowledged_at: datetime | None = None
    resolved_at: datetime | None = None
    resolution_note: str | None = None


class AlertCreate(BaseModel):
    """Internal payload used by the service layer when raising an alert."""

    store_id: str
    type: AlertType
    severity: AlertSeverity
    message: str
    camera_id: str | None = None
    shelf_id: str | None = None
    related_event_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime | None = None


class AlertList(BaseModel):
    """Paged alert response."""

    total: int
    count: int
    limit: int
    offset: int
    items: list[Alert] = Field(default_factory=list)


class AlertResolution(BaseModel):
    """Body accepted by the resolve / acknowledge endpoints."""

    note: str | None = Field(default=None, max_length=500)
