"""Small local auth API for the dashboard.

The project does not have a user database yet, so credentials come from the
environment and tokens are signed locally. This keeps sign-in functional for
development without coupling auth to MongoDB availability.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class SignInRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    email: str
    name: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserProfile


def _user() -> UserProfile:
    settings = get_settings()
    return UserProfile(
        email=settings.auth_admin_email,
        name=settings.auth_admin_name,
        role=settings.auth_admin_role,
    )


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(message: str) -> str:
    secret = get_settings().auth_secret_key.encode("utf-8")
    digest = hmac.new(secret, message.encode("ascii"), hashlib.sha256).digest()
    return _b64encode(digest)


def _create_token(user: UserProfile) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=get_settings().auth_token_expire_minutes
    )
    payload = {
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "exp": int(expires_at.timestamp()),
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{body}.{_sign(body)}", expires_at


def _decode_token(token: str) -> dict[str, Any]:
    try:
        body, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from exc

    if not hmac.compare_digest(signature, _sign(body)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    try:
        payload = json.loads(_b64decode(body))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from exc

    expires_at = datetime.fromtimestamp(payload.get("exp", 0), timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired.",
        )
    return payload


def get_current_user(authorization: str | None = Header(default=None)) -> UserProfile:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    payload = _decode_token(authorization.split(" ", 1)[1].strip())
    return UserProfile(
        email=payload["sub"],
        name=payload.get("name", get_settings().auth_admin_name),
        role=payload.get("role", get_settings().auth_admin_role),
    )


@router.post("/sign-in", response_model=AuthResponse, summary="Sign in")
async def sign_in(payload: SignInRequest) -> AuthResponse:
    settings = get_settings()
    email_ok = secrets.compare_digest(
        payload.email.lower(), settings.auth_admin_email.lower()
    )
    password_ok = secrets.compare_digest(payload.password, settings.auth_admin_password)
    if not email_ok or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    user = _user()
    token, expires_at = _create_token(user)
    return AuthResponse(access_token=token, expires_at=expires_at, user=user)


@router.get("/me", response_model=UserProfile, summary="Current user")
async def me(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return user


@router.post("/sign-out", summary="Sign out")
async def sign_out(_: UserProfile = Depends(get_current_user)) -> dict[str, bool]:
    return {"ok": True}
