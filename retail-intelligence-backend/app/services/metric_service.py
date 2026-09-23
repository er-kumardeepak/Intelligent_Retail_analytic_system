"""Footfall analytics and metric persistence.

Entries and exits arrive as individual anonymous events. This service keeps two
pre-aggregated counters per store in ``metrics`` (hourly and daily buckets) so the
dashboard does not scan the event log, and it can rebuild a full summary from the
``events`` collection whenever a range is requested.

All buckets are UTC. The store-local timezone is a presentation concern, handled
by the dashboard.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import utcnow
from app.models.events import EventIn, EventType
from app.models.metrics import (
    FootfallPoint,
    FootfallSummary,
    MetricType,
    TimeWindow,
)

logger = get_logger("metric_service")

FOOTFALL_EVENT_TYPES = (EventType.PERSON_ENTERED.value, EventType.PERSON_EXITED.value)


# --------------------------------------------------------------------------- #
# Window helpers
# --------------------------------------------------------------------------- #
def resolve_window(
    window: TimeWindow,
    start: datetime | None = None,
    end: datetime | None = None,
) -> tuple[datetime, datetime]:
    """Turn a named window into a concrete UTC range.

    ``CUSTOM`` requires ``start``; omitting ``end`` means "up to now".
    """
    now = utcnow()
    if window is TimeWindow.CUSTOM:
        if start is None:
            raise ValueError("window=custom requires a 'start' query parameter")
        resolved_start = _as_utc(start)
        resolved_end = _as_utc(end) if end else now
        if resolved_end < resolved_start:
            raise ValueError("'end' must be later than 'start'")
        return resolved_start, resolved_end

    if window is TimeWindow.LAST_7_DAYS:
        return now - timedelta(days=7), now
    if window is TimeWindow.LAST_30_DAYS:
        return now - timedelta(days=30), now

    # TODAY — midnight UTC up to now.
    return now.replace(hour=0, minute=0, second=0, microsecond=0), now


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def hour_bucket(moment: datetime) -> datetime:
    return moment.replace(minute=0, second=0, microsecond=0)


def day_bucket(moment: datetime) -> datetime:
    return moment.replace(hour=0, minute=0, second=0, microsecond=0)


# --------------------------------------------------------------------------- #
# Writes
# --------------------------------------------------------------------------- #
async def _bump_bucket(
    db: AsyncIOMotorDatabase,
    store_id: str,
    metric_type: MetricType,
    bucket_start: datetime,
    increments: dict[str, int],
) -> None:
    """Increase counters inside one metric bucket, creating it if needed."""
    await db["metrics"].update_one(
        {
            "store_id": store_id,
            "metric_type": metric_type.value,
            "bucket_start": bucket_start,
        },
        {
            "$inc": {f"data.{field}": value for field, value in increments.items()},
            "$set": {"updated_at": utcnow()},
            "$setOnInsert": {
                "store_id": store_id,
                "metric_type": metric_type.value,
                "bucket_start": bucket_start,
            },
        },
        upsert=True,
    )


async def record_footfall_event(db: AsyncIOMotorDatabase, event: EventIn) -> None:
    """Update the hourly and daily counters for one entry or exit."""
    field = "entries" if event.event_type is EventType.PERSON_ENTERED else "exits"

    await _bump_bucket(
        db,
        event.store_id,
        MetricType.FOOTFALL_HOURLY,
        hour_bucket(event.timestamp),
        {field: 1},
    )
    await _bump_bucket(
        db,
        event.store_id,
        MetricType.FOOTFALL_DAILY,
        day_bucket(event.timestamp),
        {field: 1},
    )


async def get_stored_metric_totals(
    db: AsyncIOMotorDatabase,
    store_id: str,
    metric_type: MetricType,
    start: datetime,
    end: datetime,
) -> dict[str, Any]:
    """Sum the persisted buckets in a range — the cheap pre-aggregated read."""
    pipeline: list[dict[str, Any]] = [
        {
            "$match": {
                "store_id": store_id,
                "metric_type": metric_type.value,
                "bucket_start": {"$gte": start, "$lte": end},
            }
        },
        {
            "$group": {
                "_id": None,
                "entries": {"$sum": "$data.entries"},
                "exits": {"$sum": "$data.exits"},
                "buckets": {"$sum": 1},
            }
        },
    ]
    cursor = db["metrics"].aggregate(pipeline)
    rows = [row async for row in cursor]
    if not rows:
        return {"entries": 0, "exits": 0, "buckets": 0}
    row = rows[0]
    return {
        "entries": int(row.get("entries") or 0),
        "exits": int(row.get("exits") or 0),
        "buckets": int(row.get("buckets") or 0),
    }


# --------------------------------------------------------------------------- #
# Reads
# --------------------------------------------------------------------------- #
async def _group_events(
    db: AsyncIOMotorDatabase,
    store_id: str,
    event_type: str,
    start: datetime,
    end: datetime,
    date_unit: str,
) -> dict[datetime, int]:
    """Count one event type per bucket, straight from the event log."""
    pipeline: list[dict[str, Any]] = [
        {
            "$match": {
                "store_id": store_id,
                "event_type": event_type,
                "timestamp": {"$gte": start, "$lte": end},
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateTrunc": {"date": "$timestamp", "unit": date_unit, "timezone": "UTC"}
                },
                "count": {"$sum": 1},
            }
        },
    ]
    cursor = db["events"].aggregate(pipeline)
    return {
        _as_utc(row["_id"]): int(row["count"])
        async for row in cursor
        if row["_id"] is not None
    }


def _merge_series(
    entries: dict[datetime, int],
    exits: dict[datetime, int],
    label_format: str,
) -> list[FootfallPoint]:
    buckets = sorted(set(entries) | set(exits))
    return [
        FootfallPoint(
            bucket_start=bucket,
            label=bucket.strftime(label_format),
            entries=entries.get(bucket, 0),
            exits=exits.get(bucket, 0),
            net=entries.get(bucket, 0) - exits.get(bucket, 0),
        )
        for bucket in buckets
    ]


def _trend_percentage(hourly: list[FootfallPoint]) -> float | None:
    """Compare the newest hour against the one before it."""
    if len(hourly) < 2:
        return None
    previous, latest = hourly[-2], hourly[-1]
    if previous.entries == 0:
        return None
    change = (latest.entries - previous.entries) / previous.entries * 100
    return round(change, 1)


async def get_footfall_summary(
    db: AsyncIOMotorDatabase,
    store_id: str,
    window: TimeWindow = TimeWindow.TODAY,
    start: datetime | None = None,
    end: datetime | None = None,
) -> FootfallSummary:
    """Entries, exits, current occupancy and both time series for a range."""
    resolved_start, resolved_end = resolve_window(window, start, end)

    entries = await _group_events(
        db, store_id, EventType.PERSON_ENTERED.value, resolved_start, resolved_end, "hour"
    )
    exits = await _group_events(
        db, store_id, EventType.PERSON_EXITED.value, resolved_start, resolved_end, "hour"
    )
    daily_entries = await _group_events(
        db, store_id, EventType.PERSON_ENTERED.value, resolved_start, resolved_end, "day"
    )
    daily_exits = await _group_events(
        db, store_id, EventType.PERSON_EXITED.value, resolved_start, resolved_end, "day"
    )

    hourly = _merge_series(entries, exits, "%H:%M")
    daily = _merge_series(daily_entries, daily_exits, "%d %b")

    total_entries = sum(entries.values())
    total_exits = sum(exits.values())
    peak = max(hourly, key=lambda point: point.entries, default=None)

    return FootfallSummary(
        store_id=store_id,
        window=window,
        start=resolved_start,
        end=resolved_end,
        total_entries=total_entries,
        total_exits=total_exits,
        current_occupancy=max(0, total_entries - total_exits),
        peak_hour_label=peak.label if peak else None,
        peak_hour_entries=peak.entries if peak else 0,
        trend_percentage=_trend_percentage(hourly),
        hourly=hourly,
        daily=daily,
    )


async def get_metrics_snapshot(
    db: AsyncIOMotorDatabase,
    store_id: str,
    window: TimeWindow = TimeWindow.TODAY,
    start: datetime | None = None,
    end: datetime | None = None,
) -> dict[str, Any]:
    """Combined metric payload for GET /metrics."""
    resolved_start, resolved_end = resolve_window(window, start, end)
    hourly = await get_stored_metric_totals(
        db, store_id, MetricType.FOOTFALL_HOURLY, resolved_start, resolved_end
    )
    daily = await get_stored_metric_totals(
        db, store_id, MetricType.FOOTFALL_DAILY, resolved_start, resolved_end
    )

    occupancy = await get_footfall_summary(db, store_id, window, start, end)

    return {
        "footfall": {
            "hourly_buckets": hourly["buckets"],
            "daily_buckets": daily["buckets"],
            "entries": occupancy.total_entries,
            "exits": occupancy.total_exits,
            "current_occupancy": occupancy.current_occupancy,
            "trend_percentage": occupancy.trend_percentage,
            "peak_hour": occupancy.peak_hour_label,
        },
        "persisted_counters": {
            "hourly": {"entries": hourly["entries"], "exits": hourly["exits"]},
            "daily": {"entries": daily["entries"], "exits": daily["exits"]},
        },
        "hourly_series": [point.model_dump() for point in occupancy.hourly],
        "daily_series": [point.model_dump() for point in occupancy.daily],
    }


async def log_metric_refresh(
    db: AsyncIOMotorDatabase, store_id: str, summary: FootfallSummary
) -> None:
    """Keep a lightweight operational trace of aggregate reads."""
    logger.debug(
        "Footfall summary for %s: entries=%s exits=%s occupancy=%s",
        store_id,
        summary.total_entries,
        summary.total_exits,
        summary.current_occupancy,
    )
