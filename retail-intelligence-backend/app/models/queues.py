"""Queue models.

A queue update is a snapshot of a checkout zone: how many people are waiting,
how fast they arrive, how fast they are served and how many counters are open.
Everything the prediction layer needs is here — no historical model is required.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class QueueStateIn(BaseModel):
    """The ``data`` block of a ``queue_update`` event."""

    model_config = ConfigDict(extra="allow")

    queue_length: int = Field(ge=0, le=1000)
    arrival_rate: float = Field(default=0.0, ge=0.0, le=100.0, description="people per minute")
    service_rate: float = Field(default=0.0, ge=0.0, le=100.0, description="people per minute")
    open_counters: int = Field(default=1, ge=0, le=50)

    @classmethod
    def from_event_data(cls, data: dict[str, Any]) -> "QueueStateIn":
        """Coerce an event payload into a queue snapshot.

        Unknown keys are ignored rather than rejected so the edge team can add
        telemetry (luminance, frame rate) without breaking ingestion.
        """
        allowed = {"queue_length", "arrival_rate", "service_rate", "open_counters"}
        return cls(**{k: v for k, v in data.items() if k in allowed})

    @model_validator(mode="after")
    def _require_capacity(self) -> "QueueStateIn":
        if self.open_counters == 0 and self.queue_length > 0:
            raise ValueError(
                "open_counters must be at least 1 while a queue is being served"
            )
        return self


class QueueState(BaseModel):
    """A stored queue snapshot (one document in ``queue_states``)."""

    store_id: str
    camera_id: str
    queue_length: int
    arrival_rate: float
    service_rate: float
    open_counters: int
    timestamp: datetime
    event_id: str | None = None


class QueuePrediction(BaseModel):
    """Explainable forward projection of the current queue."""

    store_id: str
    camera_id: str | None = None
    timestamp: datetime

    current_queue: int
    arrival_rate: float
    service_rate: float
    open_counters: int
    horizon_minutes: int

    predicted_queue: int
    net_growth_per_minute: float
    trend: str
    congestion_level: str
    minutes_until_breach: float | None = None
    breach_threshold: int
    estimated_wait_minutes: float
    formula: str
    explanation: str


class QueueSummary(BaseModel):
    """Aggregated view of the checkout zone for the dashboard."""

    store_id: str
    current_queue: int
    open_counters: int
    arrival_rate: float
    service_rate: float
    estimated_wait_minutes: float
    peak_queue: int
    average_queue: float
    samples: int
    last_updated: datetime | None = None
    series: list[dict[str, Any]] = Field(default_factory=list)
