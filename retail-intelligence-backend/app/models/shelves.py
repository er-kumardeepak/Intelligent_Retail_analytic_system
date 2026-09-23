"""Shelf models.

The vision system reports one of three states per bay. The backend keeps only
the latest state per shelf in ``shelf_states`` — the history lives in ``events``
if it is ever needed.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.models.alerts import AlertStatus


class ShelfStatus(str, Enum):
    NORMAL = "normal"
    LOW = "low"
    EMPTY = "empty"
    UNKNOWN = "unknown"


class ShelfState(BaseModel):
    """Latest known state of a single shelf bay."""

    model_config = ConfigDict(extra="ignore")

    shelf_id: str
    store_id: str
    camera_id: str
    status: ShelfStatus = ShelfStatus.UNKNOWN
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    last_detected: datetime
    alert_status: AlertStatus | None = None

    # Rolling counters, useful for the dashboard's "recurring bay" callout.
    low_events: int = 0
    empty_events: int = 0


class ShelfSummary(BaseModel):
    """Store-level shelf availability for the dashboard."""

    store_id: str
    total_shelves: int
    normal: int
    low: int
    empty: int
    unknown: int
    availability_percentage: float
    shelves_needing_attention: int
    items: list[ShelfState] = Field(default_factory=list)
