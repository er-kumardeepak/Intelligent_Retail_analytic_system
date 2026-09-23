"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.api.routes import alerts, auth, cameras, dashboard, events, queues, shelves
from app.core.config import get_logger, get_settings, setup_logging
from app.core.database import (
    close_mongo_connection,
    connect_to_mongo,
    is_connected,
    last_connection_error,
    ping,
)

setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        await connect_to_mongo()
    except PyMongoError:
        logger.warning("Starting API in degraded mode without MongoDB.")

    yield

    await close_mongo_connection()


settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(cameras.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(queues.router, prefix="/api")
app.include_router(shelves.router, prefix="/api")


@app.get("/api/health", summary="Health check")
async def health() -> dict[str, object]:
    mongo_ok = await ping() if is_connected() else False
    return {
        "ok": True,
        "mongodb": {
            "connected": mongo_ok,
            "last_error": None if mongo_ok else last_connection_error(),
        },
    }
