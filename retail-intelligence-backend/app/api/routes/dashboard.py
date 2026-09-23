"""Dashboard endpoints: store list, composite overview, footfall and metrics."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger, get_settings
from app.core.database import get_database, list_cameras, require_store, utcnow
from app.intelligence.recommendations import (
    recommend_for_cameras,
    recommend_for_queue,
    recommend_for_shelves,
    sort_recommendations,
)
from app.models.metrics import (
    FootfallSummary,
    MetricSeriesResponse,
    OverviewResponse,
    TimeWindow,
)
from app.services import (
    alert_service,
    metric_service,
    queue_service,
    shelf_service,
)

router = APIRouter(prefix="/stores", tags=["dashboard"])
logger = get_logger("routes.dashboard")

# The dashboard shows a short action list; the full set is on /recommendations.
MAX_OVERVIEW_RECOMMENDATIONS = 10


def _clean(document: dict[str, Any]) -> dict[str, Any]:
    """Drop MongoDB's ObjectId so the document is JSON-serialisable."""
    document.pop("_id", None)
    return document


@router.get("", summary="List registered stores")
async def list_stores(db: AsyncIOMotorDatabase = Depends(get_database)) -> list[dict[str, Any]]:
    cursor = db["stores"].find({}).sort("store_id", 1)
    return [_clean(document) async for document in cursor]


@router.get(
    "/{store_id}/overview",
    response_model=OverviewResponse,
    summary="Everything the dashboard needs in one call",
)
async def store_overview(
    store_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> OverviewResponse:
    await require_store(db, store_id)
    settings = get_settings()

    footfall = await metric_service.get_footfall_summary(db, store_id)
    queues = await queue_service.get_queue_summary(db, store_id)
    prediction = await queue_service.get_queue_prediction(db, store_id)
    shelves = await shelf_service.get_shelf_summary(db, store_id)
    alerts = await alert_service.get_active_alerts(db, store_id)
    cameras = await list_cameras(db, store_id)

    recommendations = []
    latest_queue = await queue_service.get_latest_queue_state(db, store_id)
    if latest_queue is not None and prediction is not None:
        recommendations += recommend_for_queue(
            latest_queue,
            prediction,
            queue_threshold=settings.queue_alert_threshold,
            predicted_threshold=settings.predicted_queue_threshold,
        )
    recommendations += recommend_for_shelves(store_id, shelves.items)
    recommendations += recommend_for_cameras(store_id, cameras)
    recommendations = sort_recommendations(recommendations)[:MAX_OVERVIEW_RECOMMENDATIONS]

    return OverviewResponse(
        store_id=store_id,
        generated_at=utcnow(),
        footfall=footfall,
        current_occupancy=footfall.current_occupancy,
        queues=queues,
        queue_prediction=prediction.model_dump(mode="json") if prediction else None,
        shelves=shelves,
        alerts=alerts,
        recommendations=recommendations,
        cameras_online=sum(1 for camera in cameras if camera.get("status") == "online"),
        cameras_total=len(cameras),
    )


@router.get(
    "/{store_id}/footfall",
    response_model=FootfallSummary,
    summary="Entry, exit and occupancy analytics",
)
async def store_footfall(
    store_id: str,
    window: TimeWindow = Query(TimeWindow.TODAY, description="today | last_7_days | last_30_days | custom"),
    start: datetime | None = Query(None, description="Required when window=custom"),
    end: datetime | None = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> FootfallSummary:
    await require_store(db, store_id)
    try:
        return await metric_service.get_footfall_summary(db, store_id, window, start, end)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get(
    "/{store_id}/metrics",
    response_model=MetricSeriesResponse,
    summary="Pre-aggregated metrics plus the series behind them",
)
async def store_metrics(
    store_id: str,
    window: TimeWindow = Query(TimeWindow.TODAY),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MetricSeriesResponse:
    await require_store(db, store_id)
    try:
        resolved_start, resolved_end = metric_service.resolve_window(window, start, end)
        metrics = await metric_service.get_metrics_snapshot(db, store_id, window, start, end)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return MetricSeriesResponse(
        store_id=store_id,
        window=window,
        start=resolved_start,
        end=resolved_end,
        metrics=metrics,
    )
