"""Alert listing and lifecycle (acknowledge / resolve)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import get_database
from app.models.alerts import (
    Alert,
    AlertList,
    AlertResolution,
    AlertSeverity,
    AlertStatus,
    AlertType,
)
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])
logger = get_logger("routes.alerts")


@router.get("", response_model=AlertList, summary="List alerts across stores")
async def list_alerts(
    store_id: str | None = Query(None),
    alert_status: AlertStatus | None = Query(None, alias="status"),
    severity: AlertSeverity | None = Query(None),
    alert_type: AlertType | None = Query(None, alias="type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> AlertList:
    return await alert_service.list_alerts(
        db,
        store_id=store_id,
        status=alert_status,
        severity=severity,
        alert_type=alert_type,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{alert_id}/resolve",
    response_model=Alert,
    summary="Mark an alert resolved",
)
async def resolve_alert(
    alert_id: str,
    payload: AlertResolution | None = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Alert:
    alert = await alert_service.resolve_alert(
        db, alert_id, payload.note if payload else None
    )
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' was not found.",
        )
    return alert


@router.post(
    "/{alert_id}/acknowledge",
    response_model=Alert,
    summary="Mark an alert acknowledged (seen, not yet fixed)",
)
async def acknowledge_alert(
    alert_id: str,
    payload: AlertResolution | None = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Alert:
    alert = await alert_service.acknowledge_alert(
        db, alert_id, payload.note if payload else None
    )
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' was not found.",
        )
    return alert
