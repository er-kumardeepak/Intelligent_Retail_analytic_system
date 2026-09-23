"""Metric models: stored aggregates and the composite dashboard payload."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.intelligence.recommendations import Recommendation
from app.models.alerts import Alert
from app.models.queues import QueueSummary
from app.models.shelves import ShelfSummary


class MetricType(str, Enum):
    """Aggregates the backend computes and persists in ``metrics``.

    Only footfall is pre-aggregated, because those counters are the ones the
    dashboard reads on every poll. Queue and shelf figures are cheap to derive
    from their latest documents, so they are not duplicated here.
    """

    FOOTFALL_HOURLY = "footfall_hourly"
    FOOTFALL_DAILY = "footfall_daily"


class TimeWindow(str, Enum):
    TODAY = "today"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    CUSTOM = "custom"


class MetricDocument(BaseModel):
    """One bucket in the ``metrics`` collection."""

    model_config = ConfigDict(extra="ignore")

    store_id: str
    metric_type: MetricType
    bucket_start: datetime
    data: dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime


class FootfallPoint(BaseModel):
    """One bucket in a footfall series."""

    bucket_start: datetime
    label: str
    entries: int
    exits: int
    net: int


class FootfallSummary(BaseModel):
    """Entries, exits and occupancy derived from person_entered / person_exited."""

    store_id: str
    window: TimeWindow
    start: datetime
    end: datetime
    total_entries: int
    total_exits: int
    current_occupancy: int
    peak_hour_label: str | None = None
    peak_hour_entries: int = 0
    trend_percentage: float | None = None
    hourly: list[FootfallPoint] = Field(default_factory=list)
    daily: list[FootfallPoint] = Field(default_factory=list)


class OverviewResponse(BaseModel):
    """Everything the dashboard needs in a single round trip."""

    store_id: str
    generated_at: datetime
    footfall: FootfallSummary
    current_occupancy: int
    queues: QueueSummary
    queue_prediction: dict[str, Any] | None = None
    shelves: ShelfSummary
    alerts: list[Alert] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    cameras_online: int = 0
    cameras_total: int = 0


class MetricSeriesResponse(BaseModel):
    """Response for GET /api/stores/{store_id}/metrics."""

    store_id: str
    window: TimeWindow
    start: datetime
    end: datetime
    metrics: dict[str, Any] = Field(default_factory=dict)
