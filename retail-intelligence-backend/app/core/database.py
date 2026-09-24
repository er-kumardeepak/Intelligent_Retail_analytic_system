"""MongoDB connection handling, index management and small database helpers.

The application owns a single Motor client for its lifetime. Connection failures
are reported rather than swallowed, but they never stop the process: an edge
deployment must stay up (and keep answering /api/health) when MongoDB is
temporarily unavailable.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Iterable

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError

from app.core.config import get_logger, get_settings

logger = get_logger("database")

# Every collection the MVP uses. Camera video never appears here: only
# structured events, aggregate metrics, alerts and configuration.
COLLECTIONS: tuple[str, ...] = (
    "stores",
    "cameras",
    "events",
    "metrics",
    "alerts",
    "queue_states",
    "shelf_states",
    "system_logs",
)

# Deliberately small: one compound index per real query shape, nothing more.
INDEXES: dict[str, list[IndexModel]] = {
    "stores": [IndexModel([("store_id", ASCENDING)], unique=True)],
    "cameras": [
        IndexModel([("camera_id", ASCENDING)], unique=True),
        IndexModel([("store_id", ASCENDING), ("status", ASCENDING)]),
    ],
    "events": [
        IndexModel([("store_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("camera_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("event_type", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("event_id", ASCENDING)], unique=True),
    ],
    "metrics": [
        IndexModel(
            [
                ("store_id", ASCENDING),
                ("metric_type", ASCENDING),
                ("bucket_start", DESCENDING),
            ]
        )
    ],
    "alerts": [
        IndexModel([("store_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("status", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("alert_id", ASCENDING)], unique=True),
    ],
    "queue_states": [
        IndexModel([("store_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("camera_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("timestamp", DESCENDING)]),
    ],
    "shelf_states": [
        IndexModel([("shelf_id", ASCENDING)], unique=True),
        IndexModel([("store_id", ASCENDING), ("status", ASCENDING)]),
    ],
    "system_logs": [
        IndexModel([("timestamp", DESCENDING)]),
        IndexModel([("store_id", ASCENDING), ("timestamp", DESCENDING)]),
    ],
}

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None
_last_connection_error: str | None = None


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp. Every stored date goes through this."""
    return datetime.now(timezone.utc)


def build_client() -> AsyncIOMotorClient:
    """Create a Motor client from the current settings."""
    settings = get_settings()
    return AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
        tz_aware=True,
        uuidRepresentation="standard",
    )


async def connect_to_mongo(retries: int = 5, delay_seconds: float = 1.0) -> AsyncIOMotorDatabase:
    """Open the client, verify the server answers, then ensure indexes.

    Raises :class:`PyMongoError` so the caller can decide whether to abort or
    continue in a degraded state.
    """
    global _client, _database, _last_connection_error

    settings = get_settings()
    if _client is None:
        _client = build_client()

    last_error: PyMongoError | None = None
    for attempt in range(1, retries + 1):
        try:
            await _client.admin.command("ping")
            last_error = None
            break
        except PyMongoError as exc:  # pragma: no cover - depends on the environment
            last_error = exc
            _last_connection_error = str(exc)
            logger.warning(
                "MongoDB ping attempt %d/%d failed at %s: %s",
                attempt,
                retries,
                settings.mongodb_uri,
                exc,
            )
            if attempt < retries:
                await asyncio.sleep(delay_seconds)

    if last_error is not None:
        logger.error(
            "MongoDB unreachable at %s: %s", settings.mongodb_uri, last_error
        )
        raise last_error

    _database = _client[settings.database_name]
    _last_connection_error = None
    logger.info("Connected to MongoDB database '%s'", settings.database_name)

    await ensure_indexes(_database)
    from app.core.seed import seed_reference_data

    await seed_reference_data(_database)
    return _database


async def ensure_indexes(database: AsyncIOMotorDatabase) -> None:
    """Create the collection indexes. Safe to run on every startup."""
    for collection_name, index_models in INDEXES.items():
        if not index_models:
            continue
        try:
            await database[collection_name].create_indexes(index_models)
        except PyMongoError as exc:  # pragma: no cover - depends on the environment
            logger.warning(
                "Could not create indexes on '%s': %s", collection_name, exc
            )
    logger.info("MongoDB indexes verified for %d collections", len(INDEXES))


async def close_mongo_connection() -> None:
    """Close the client on shutdown."""
    global _client, _database
    if _client is not None:
        _client.close()
        logger.info("MongoDB connection closed")
    _client = None
    _database = None


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency returning the active database.

    Raises HTTP 503 with an actionable message when MongoDB was never reachable,
    which is what a dashboard should see rather than a stack trace.
    """
    if _database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "MongoDB is not connected. Start mongod and check MONGODB_URI "
                f"({get_settings().mongodb_uri})."
                + (f" Last error: {_last_connection_error}" if _last_connection_error else "")
            ),
        )
    return _database


def is_connected() -> bool:
    return _database is not None


def last_connection_error() -> str | None:
    return _last_connection_error


async def ping() -> bool:
    """Cheap liveness probe used by /api/health."""
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except PyMongoError as exc:
        global _last_connection_error
        _last_connection_error = str(exc)
        logger.warning("MongoDB ping failed: %s", exc)
        return False


async def aggregate(
    database: AsyncIOMotorDatabase,
    collection: str,
    pipeline: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Run an aggregation pipeline and collect the cursor into a list."""
    cursor = database[collection].aggregate(list(pipeline))
    return [document async for document in cursor]


# --------------------------------------------------------------------------- #
# Reusable document lookups
# --------------------------------------------------------------------------- #
async def get_store(
    database: AsyncIOMotorDatabase, store_id: str
) -> dict[str, Any] | None:
    """Return a store document, or None when it is unknown."""
    return await database["stores"].find_one({"store_id": store_id})


async def require_store(
    database: AsyncIOMotorDatabase, store_id: str
) -> dict[str, Any]:
    """Look up a store or fail with a clean 404."""
    store = await get_store(database, store_id)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{store_id}' is not registered with this backend.",
        )
    return store


async def get_camera(
    database: AsyncIOMotorDatabase, camera_id: str
) -> dict[str, Any] | None:
    return await database["cameras"].find_one({"camera_id": camera_id})


async def list_cameras(
    database: AsyncIOMotorDatabase,
    store_id: str | None = None,
    status_filter: str | None = None,
) -> list[dict[str, Any]]:
    """Cameras for a store (or all stores), optionally filtered by health."""
    query: dict[str, Any] = {}
    if store_id:
        query["store_id"] = store_id
    if status_filter:
        query["status"] = status_filter
    cursor = database["cameras"].find(query).sort("camera_id", ASCENDING)
    return [document async for document in cursor]


async def log_system_event(
    database: AsyncIOMotorDatabase | None,
    level: str,
    message: str,
    *,
    store_id: str | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    """Persist an operational log line. Never called with customer data."""
    logger.log(getattr(logging_level(level), "value", 20), "%s %s", level.upper(), message)
    if database is None:
        return
    try:
        await database["system_logs"].insert_one(
            {
                "level": level.upper(),
                "message": message,
                "store_id": store_id,
                "context": context or {},
                "timestamp": utcnow(),
            }
        )
    except PyMongoError as exc:  # pragma: no cover - depends on the environment
        logger.warning("Could not persist system log: %s", exc)


def logging_level(level: str) -> int:
    """Map a level name onto its numeric value."""
    import logging

    return getattr(logging, level.upper(), logging.INFO)
