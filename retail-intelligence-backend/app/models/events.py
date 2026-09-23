"""Event contract between the edge AI pipeline and this backend.

The edge device emits structured, anonymous detections. This module is the only
place where an incoming event is trusted, so it is also where the privacy rules
are enforced: keys that would carry identity or imagery are rejected outright.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.database import utcnow


class EventType(str, Enum):
    """The complete set of detections the edge pipeline may send."""

    PERSON_ENTERED = "person_entered"
    PERSON_EXITED = "person_exited"
    ZONE_ENTERED = "zone_entered"
    ZONE_EXITED = "zone_exited"
    QUEUE_UPDATE = "queue_update"
    SHELF_EMPTY = "shelf_empty"
    SHELF_LOW = "shelf_low"
    SHELF_NORMAL = "shelf_normal"
    COUNTER_OPENED = "counter_opened"
    COUNTER_CLOSED = "counter_closed"
    CONGESTION_PREDICTED = "congestion_predicted"


class PrivacyViolationError(ValueError):
    """Raised when an event payload tries to carry personal or image data."""


# A key is rejected when any of its underscore-separated tokens appears here.
# Matching on tokens (not raw substrings) keeps legitimate fields such as
# "surface_id" or "storage_state" publishable while "face_image" is not.
PRIVATE_TOKENS: frozenset[str] = frozenset(
    {
        "face",
        "facial",
        "embedding",
        "embeddings",
        "biometric",
        "biometrics",
        "fingerprint",
        "iris",
        "retina",
        "passport",
        "aadhaar",
        "ssn",
        "phone",
        "mobile",
        "email",
        "name",
        "names",
        "photo",
        "image",
        "images",
        "snapshot",
        "video",
        "identity",
    }
)

# Whole keys that are allowed even though a token above is present.
SAFE_KEYS: frozenset[str] = frozenset(
    {
        "frame_rate",
        "frames_dropped",
        "image_quality",
        "video_quality",
        "storage_state",
    }
)


def _tokenize(key: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", key.lower()) if token]


def find_privacy_violations(payload: Any, path: str = "data") -> list[str]:
    """Return the paths of every payload key that would violate the privacy model."""
    violations: list[str] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            key_str = str(key)
            child_path = f"{path}.{key_str}"
            if key_str.lower() not in SAFE_KEYS:
                if any(token in PRIVATE_TOKENS for token in _tokenize(key_str)):
                    violations.append(child_path)
            violations.extend(find_privacy_violations(value, child_path))
    elif isinstance(payload, (list, tuple)):
        for index, item in enumerate(payload):
            violations.extend(find_privacy_violations(item, f"{path}[{index}]"))
    return violations


class EventIn(BaseModel):
    """A single detection from the edge device.

    ``event_id`` is optional: the edge assigns one, and a generated value keeps
    hand-fired curl requests simple during a demo.
    """

    model_config = ConfigDict(extra="forbid")

    event_id: str = Field(default_factory=lambda: f"evt_{uuid4().hex}")
    store_id: str = Field(min_length=1, max_length=64)
    camera_id: str = Field(min_length=1, max_length=64)
    event_type: EventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    @field_validator("timestamp")
    @classmethod
    def _require_timezone(cls, value: datetime) -> datetime:
        """Naive timestamps are assumed to be UTC, never silently local time."""
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @field_validator("data")
    @classmethod
    def _reject_personal_data(cls, value: dict[str, Any]) -> dict[str, Any]:
        violations = find_privacy_violations(value)
        if violations:
            raise PrivacyViolationError(
                "Event payload rejected: these fields are not acceptable on a "
                "privacy-first pipeline -> " + ", ".join(sorted(violations))
            )
        return value

    @model_validator(mode="after")
    def _validate_payload_for_type(self) -> "EventIn":
        """Queue updates must carry the numeric fields the intelligence needs."""
        if self.event_type is EventType.QUEUE_UPDATE:
            # Imported lazily so the models stay free of import cycles.
            from app.models.queues import QueueStateIn

            self.data = QueueStateIn.from_event_data(self.data).model_dump()
        return self

    @property
    def shelf_id(self) -> str | None:
        """Shelf identifier for shelf events, falling back to the camera."""
        for key in ("shelf_id", "bay_id", "shelf"):
            value = self.data.get(key)
            if isinstance(value, str) and value:
                return value
        if self.event_type in {
            EventType.SHELF_EMPTY,
            EventType.SHELF_LOW,
            EventType.SHELF_NORMAL,
        }:
            return self.camera_id
        return None

    def to_document(self) -> dict[str, Any]:
        """The exact document stored in the ``events`` collection."""
        return {
            "event_id": self.event_id,
            "store_id": self.store_id,
            "camera_id": self.camera_id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp,
            "data": self.data,
            "confidence": self.confidence,
            "received_at": utcnow(),
        }


class EventOut(BaseModel):
    """An event as returned by the API."""

    event_id: str
    store_id: str
    camera_id: str
    event_type: EventType
    timestamp: datetime
    data: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    received_at: datetime | None = None


class EventList(BaseModel):
    """Paged event response."""

    total: int
    count: int
    limit: int
    offset: int
    items: list[EventOut] = Field(default_factory=list)


class EventIngestResult(BaseModel):
    """What the edge device gets back after posting an event."""

    stored: bool
    duplicate: bool = False
    event: EventOut
    alerts_created: list[dict[str, Any]] = Field(default_factory=list)
    recommendations: list[dict[str, Any]] = Field(default_factory=list)
