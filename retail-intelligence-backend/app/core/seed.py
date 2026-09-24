"""Idempotent demo documents so the dashboard has stores and cameras.

Store IDs match ``src/lib/mock-data.ts`` on the frontend (BLR-014, …).
Camera IDs for the primary store match CAM-01 … CAM-12 so event ingestion
and the UI speak the same identifiers.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_logger
from app.core.database import utcnow

logger = get_logger("seed")

PRIMARY_STORE_ID = "BLR-014"

STORES: list[dict[str, Any]] = [
    {
        "store_id": "BLR-014",
        "name": "Bengaluru · Indiranagar",
        "city": "Bengaluru",
        "area_sqft": 4200,
        "timezone": "Asia/Kolkata",
        "status": "active",
    },
    {
        "store_id": "BLR-021",
        "name": "Bengaluru · Koramangala",
        "city": "Bengaluru",
        "area_sqft": 3100,
        "timezone": "Asia/Kolkata",
        "status": "active",
    },
    {
        "store_id": "HYD-007",
        "name": "Hyderabad · Gachibowli",
        "city": "Hyderabad",
        "area_sqft": 5650,
        "timezone": "Asia/Kolkata",
        "status": "active",
    },
    {
        "store_id": "MUM-032",
        "name": "Mumbai · Andheri West",
        "city": "Mumbai",
        "area_sqft": 3880,
        "timezone": "Asia/Kolkata",
        "status": "active",
    },
]

PRIMARY_CAMERAS: list[dict[str, Any]] = [
    {"camera_id": "CAM-01", "name": "Entrance", "zone": "MAIN ENTRANCE", "status": "online"},
    {"camera_id": "CAM-02", "name": "Aisle 01", "zone": "BEVERAGES", "status": "online"},
    {"camera_id": "CAM-03", "name": "Checkout", "zone": "CHECKOUT 01–04", "status": "warning"},
    {"camera_id": "CAM-04", "name": "Shelf zone", "zone": "DAIRY BAYS", "status": "offline"},
    {"camera_id": "CAM-05", "name": "Aisle 02", "zone": "SNACKS", "status": "online"},
    {"camera_id": "CAM-06", "name": "Aisle 03", "zone": "DAIRY", "status": "online"},
    {"camera_id": "CAM-07", "name": "Aisle 04", "zone": "HOUSEHOLD", "status": "online"},
    {"camera_id": "CAM-08", "name": "Queue lane", "zone": "QUEUE ZONE", "status": "online"},
    {"camera_id": "CAM-09", "name": "Stockroom", "zone": "BACK OF STORE", "status": "online"},
    {"camera_id": "CAM-10", "name": "Cold storage", "zone": "BACK OF STORE", "status": "online"},
    {"camera_id": "CAM-11", "name": "Exit", "zone": "EXIT CORRIDOR", "status": "online"},
    {"camera_id": "CAM-12", "name": "End cap", "zone": "PROMO BAYS", "status": "online"},
]

PRIMARY_SHELVES: list[dict[str, Any]] = [
    {"shelf_id": "sh-01", "camera_id": "CAM-02", "status": "normal", "confidence": 0.94},
    {"shelf_id": "sh-02", "camera_id": "CAM-05", "status": "normal", "confidence": 0.88},
    {"shelf_id": "sh-03", "camera_id": "CAM-06", "status": "low", "confidence": 0.81},
    {"shelf_id": "sh-04", "camera_id": "CAM-07", "status": "normal", "confidence": 0.91},
    {"shelf_id": "sh-05", "camera_id": "CAM-07", "status": "low", "confidence": 0.76},
    {"shelf_id": "sh-06", "camera_id": "CAM-06", "status": "empty", "confidence": 0.89},
    {"shelf_id": "sh-07", "camera_id": "CAM-05", "status": "normal", "confidence": 0.85},
    {"shelf_id": "sh-08", "camera_id": "CAM-07", "status": "normal", "confidence": 0.93},
    {"shelf_id": "sh-09", "camera_id": "CAM-02", "status": "empty", "confidence": 0.92},
]


async def seed_reference_data(database: AsyncIOMotorDatabase) -> None:
    """Upsert stores, cameras and a baseline shelf snapshot for the demo store."""
    now = utcnow()

    for store in STORES:
        document = {**store, "updated_at": now}
        await database["stores"].update_one(
            {"store_id": store["store_id"]},
            {"$set": document, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    for camera in PRIMARY_CAMERAS:
        document = {
            **camera,
            "store_id": PRIMARY_STORE_ID,
            "updated_at": now,
        }
        await database["cameras"].update_one(
            {"camera_id": camera["camera_id"]},
            {"$set": document, "$setOnInsert": {"enrolled_at": now}},
            upsert=True,
        )

    for store in STORES:
        if store["store_id"] == PRIMARY_STORE_ID:
            continue
        camera_id = f"{store['store_id']}-CAM-01"
        await database["cameras"].update_one(
            {"camera_id": camera_id},
            {
                "$set": {
                    "camera_id": camera_id,
                    "store_id": store["store_id"],
                    "name": "Entrance",
                    "zone": "MAIN ENTRANCE",
                    "status": "online",
                    "updated_at": now,
                },
                "$setOnInsert": {"enrolled_at": now},
            },
            upsert=True,
        )

    for shelf in PRIMARY_SHELVES:
        await database["shelf_states"].update_one(
            {"shelf_id": shelf["shelf_id"]},
            {
                "$set": {
                    **shelf,
                    "store_id": PRIMARY_STORE_ID,
                    "last_detected": now,
                    "low_events": 1 if shelf["status"] == "low" else 0,
                    "empty_events": 1 if shelf["status"] == "empty" else 0,
                }
            },
            upsert=True,
        )

    latest = await database["queue_states"].find_one(
        {"store_id": PRIMARY_STORE_ID}, sort=[("timestamp", -1)]
    )
    if latest is None:
        await database["queue_states"].insert_one(
            {
                "store_id": PRIMARY_STORE_ID,
                "camera_id": "CAM-08",
                "queue_length": 6,
                "arrival_rate": 2.4,
                "service_rate": 1.8,
                "open_counters": 3,
                "timestamp": now - timedelta(minutes=1),
                "event_id": "seed_queue_001",
                "received_at": now,
            }
        )

    logger.info(
        "Reference data ready: %d stores, primary store %s",
        len(STORES),
        PRIMARY_STORE_ID,
    )
