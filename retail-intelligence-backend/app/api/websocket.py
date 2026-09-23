"""WebSocket fan-out.

The dashboard opens one socket per store and receives everything the pipeline
produces: new alerts, queue updates, shelf transitions, footfall changes and
recommendations. Clients may also send ``ping`` (answered with ``pong``) and
``snapshot`` (answered with the current state).
"""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_logger
from app.core.database import is_connected

logger = get_logger("websocket")

router = APIRouter()


class ConnectionManager:
    """Tracks connected dashboards, grouped by store."""

    def __init__(self) -> None:
        self._channels: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, store_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._channels.setdefault(store_id, set()).add(websocket)
        logger.info(
            "WebSocket connected for store %s (%d client(s) on channel)",
            store_id,
            self.connection_count(store_id),
        )

    async def disconnect(self, store_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            channel = self._channels.get(store_id)
            if channel and websocket in channel:
                channel.discard(websocket)
            if channel is not None and not channel:
                self._channels.pop(store_id, None)
        logger.info(
            "WebSocket disconnected for store %s (%d client(s) left)",
            store_id,
            self.connection_count(store_id),
        )

    def connection_count(self, store_id: str | None = None) -> int:
        if store_id is None:
            return sum(len(channel) for channel in self._channels.values())
        return len(self._channels.get(store_id, ()))

    async def broadcast(self, store_id: str, message: dict[str, Any]) -> int:
        """Send a message to every client on a store channel.

        Sockets that fail are dropped rather than retried: a dashboard that
        vanished must not block the ingestion path.
        """
        async with self._lock:
            targets = list(self._channels.get(store_id, ()))
        if not targets:
            return 0

        results = await asyncio.gather(
            *(self._safe_send(socket, message) for socket in targets),
            return_exceptions=True,
        )
        delivered = sum(1 for result in results if result is True)
        if delivered != len(targets):
            logger.debug(
                "Broadcast to %s reached %d/%d clients", store_id, delivered, len(targets)
            )
        return delivered

    async def _safe_send(self, websocket: WebSocket, message: dict[str, Any]) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except Exception as exc:  # noqa: BLE001 - any socket failure is a drop
            logger.warning("Dropping unreachable WebSocket client: %s", exc)
            return False


manager = ConnectionManager()


async def build_snapshot(store_id: str) -> dict[str, Any]:
    """Current dashboard state, used on connect and for ``snapshot`` requests.

    Imported lazily: the services publish through this module, so importing them
    at module scope would create a cycle.
    """
    from app.core.database import get_database
    from app.services import alert_service, metric_service, queue_service, shelf_service

    if not is_connected():
        return {
            "type": "snapshot",
            "store_id": store_id,
            "available": False,
            "detail": "MongoDB is not connected; live state is unavailable.",
        }

    try:
        db = get_database()
        footfall = await metric_service.get_footfall_summary(db, store_id)
        queues = await queue_service.get_queue_summary(db, store_id)
        shelves = await shelf_service.get_shelf_summary(db, store_id)
        alerts = await alert_service.get_active_alerts(db, store_id, limit=10)
        return {
            "type": "snapshot",
            "store_id": store_id,
            "available": True,
            "footfall": footfall.model_dump(mode="json"),
            "queues": queues.model_dump(mode="json"),
            "shelves": shelves.model_dump(mode="json"),
            "alerts": [alert.model_dump(mode="json") for alert in alerts],
        }
    except Exception as exc:  # noqa: BLE001 - never break the socket on a read error
        logger.warning("Snapshot for %s failed: %s", store_id, exc)
        return {
            "type": "snapshot",
            "store_id": store_id,
            "available": False,
            "detail": f"Snapshot unavailable: {exc}",
        }


@router.websocket("/ws/{store_id}")
async def store_events_socket(websocket: WebSocket, store_id: str) -> None:
    """Live update channel for one store."""
    await manager.connect(store_id, websocket)

    await websocket.send_json(
        {
            "type": "connected",
            "store_id": store_id,
            "clients": manager.connection_count(store_id),
            "database_connected": is_connected(),
            "channels": [
                "alert",
                "queue_update",
                "shelf_update",
                "footfall_update",
                "recommendation",
                "event",
            ],
        }
    )

    try:
        while True:
            raw = await websocket.receive_text()
            command = raw.strip().lower()
            if command in {"ping", ""}:
                await websocket.send_json({"type": "pong", "store_id": store_id})
            elif command == "snapshot":
                await websocket.send_json(await build_snapshot(store_id))
            else:
                await websocket.send_json(
                    {"type": "ack", "store_id": store_id, "received": raw[:200]}
                )
    except WebSocketDisconnect:
        await manager.disconnect(store_id, websocket)
    except Exception as exc:  # noqa: BLE001 - log and clean up, never crash the app
        logger.warning("WebSocket error for store %s: %s", store_id, exc)
        await manager.disconnect(store_id, websocket)
