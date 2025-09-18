"""Minimal auth identity and scope checks (stub)."""
from __future__ import annotations

from typing import Callable, List

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from src.brainsait.rbac.roles import ROLES_TO_SCOPES


class User(BaseModel):
    id: str
    role: str
    scopes: List[str]


def get_current_user() -> User:
    """Stub current user provider.

    Replace with JWT/OIDC extraction in production. Defaults to an insurer
    analyst to keep demo flows unblocked while RBAC is wired through.
    """

    role = "insurer_analyst"
    scopes = ROLES_TO_SCOPES.get(role, [])
    return User(id="user-001", role=role, scopes=scopes)


def require_scope(required: List[str]) -> Callable[[User], None]:
    """FastAPI dependency ensuring the request has one of the scopes."""

    def dependency(user: User = Depends(get_current_user)) -> None:
        if not any(scope in user.scopes for scope in required):
            raise HTTPException(status_code=403, detail="Insufficient scope")

    return dependency
