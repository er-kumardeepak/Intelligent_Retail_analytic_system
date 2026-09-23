"""Application configuration.

Everything that varies between deployments is read from the environment (or a
local ``.env`` file). Credentials are never hardcoded, and the module exposes a
single cached :class:`Settings` instance so the rest of the app shares one view
of the configuration.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

# Loaded once, at import time, so `python -m app.main` and the seed script both
# pick up a local .env without extra wiring.
load_dotenv()

LOGGER_NAME = "retail_intelligence"


class Settings(BaseModel):
    """Runtime configuration, validated at startup."""

    app_name: str = "Retail Intelligence Backend"
    version: str = "0.1.0"
    environment: str = "development"

    host: str = "0.0.0.0"
    port: int = Field(default=8000, ge=1, le=65535)

    # --- MongoDB -----------------------------------------------------------
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "retail_intelligence"
    # Kept short so a local, not-yet-started mongod fails fast with a clear
    # message instead of hanging the request.
    mongo_server_selection_timeout_ms: int = Field(default=4000, ge=0)

    # --- Deterministic intelligence thresholds ------------------------------
    # The MVP uses fixed rules, not a model, so every alert and recommendation
    # can be explained by quoting the numbers that triggered it.
    queue_alert_threshold: int = Field(default=5, ge=1)
    predicted_queue_threshold: int = Field(default=8, ge=1)
    queue_prediction_minutes: int = Field(default=5, ge=1, le=120)
    shelf_low_confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)

    # --- HTTP ---------------------------------------------------------------
    cors_origins: list[str] = Field(default_factory=list)
    log_level: str = "INFO"

    # --- Local dashboard auth ----------------------------------------------
    auth_secret_key: str = "change-me-in-production"
    auth_token_expire_minutes: int = Field(default=480, ge=1)
    auth_admin_email: str = "manager@retail.ai"
    auth_admin_password: str = "password123"
    auth_admin_name: str = "A. Krishnan"
    auth_admin_role: str = "store_manager"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        """Accept ``"a,b"`` from the environment as well as a real list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("log_level", mode="before")
    @classmethod
    def _upper_log_level(cls, value: object) -> object:
        return value.upper() if isinstance(value, str) else value


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    return value if value not in (None, "") else default


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Build the settings from the environment exactly once."""
    return Settings(
        app_name=_env("APP_NAME", "Retail Intelligence Backend"),
        environment=_env("ENVIRONMENT", "development"),
        host=_env("HOST", "0.0.0.0"),
        port=int(_env("PORT", "8000")),
        mongodb_uri=_env("MONGODB_URI", "mongodb://localhost:27017"),
        database_name=_env("DATABASE_NAME", "retail_intelligence"),
        mongo_server_selection_timeout_ms=int(
            _env("MONGO_SERVER_SELECTION_TIMEOUT_MS", "4000")
        ),
        queue_alert_threshold=int(_env("QUEUE_ALERT_THRESHOLD", "5")),
        predicted_queue_threshold=int(_env("PREDICTED_QUEUE_THRESHOLD", "8")),
        queue_prediction_minutes=int(_env("QUEUE_PREDICTION_MINUTES", "5")),
        shelf_low_confidence_threshold=float(
            _env("SHELF_LOW_CONFIDENCE_THRESHOLD", "0.5")
        ),
        cors_origins=_env(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ),
        log_level=_env("LOG_LEVEL", "INFO"),
        auth_secret_key=_env("AUTH_SECRET_KEY", "dev-retail-intelligence-secret"),
        auth_token_expire_minutes=int(_env("AUTH_TOKEN_EXPIRE_MINUTES", "480")),
        auth_admin_email=_env("AUTH_ADMIN_EMAIL", "manager@retail.ai"),
        auth_admin_password=_env("AUTH_ADMIN_PASSWORD", "password123"),
        auth_admin_name=_env("AUTH_ADMIN_NAME", "A. Krishnan"),
        auth_admin_role=_env("AUTH_ADMIN_ROLE", "store_manager"),
    )


def setup_logging() -> None:
    """Configure application logging once. Operates on the process root logger."""
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    # Motor/PyMongo are chatty about topology changes at INFO; keep them quieter
    # so the application's own pipeline logging stays readable.
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger namespaced under the application logger."""
    return logging.getLogger(f"{LOGGER_NAME}.{name}" if name else LOGGER_NAME)
