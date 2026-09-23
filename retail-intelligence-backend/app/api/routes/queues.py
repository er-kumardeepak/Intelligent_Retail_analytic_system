"""Queue endpoints: current state, history summary and the forward prediction."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import get_database, require_store
from app.models.metrics import TimeWindow
from app.models.queues import QueuePrediction, QueueSummary
from app.services import queue_service

router = APIRouter(prefix="/stores/{store_id}", tags=["queues"])
logger = get_logger("routes.queues")


@router.get(
    "/queues",
    response_model=QueueSummary,
    summary="Checkout queue state plus peak/average over a window",
)
async def store_queues(
    store_id: str,
    window: TimeWindow = Query(TimeWindow.TODAY),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> QueueSummary:
    await require_store(db, store_id)
    try:
        return await queue_service.get_queue_summary(db, store_id, window, start, end)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get(
    "/queues/prediction",
    response_model=QueuePrediction,
    summary="Projected queue length with the arithmetic shown",
)
async def queue_prediction(
    store_id: str,
    horizon_minutes: int | None = Query(
        None, ge=1, le=120, description="Overrides QUEUE_PREDICTION_MINUTES"
    ),
    threshold: int | None = Query(
        None, ge=1, description="Breach threshold used for congestion level"
    ),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> QueuePrediction:
    await require_store(db, store_id)
    prediction = await queue_service.get_queue_prediction(
        db, store_id, horizon_minutes=horizon_minutes, breach_threshold=threshold
    )
    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No queue snapshots have been received for store '{store_id}'. "
                "POST a queue_update event first."
            ),
        )
    return prediction
