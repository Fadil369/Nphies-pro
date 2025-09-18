"""HIPAA/NPHIES compliance decorators for FastAPI endpoints."""
from __future__ import annotations

import asyncio
from functools import wraps
from typing import Any, Awaitable, Callable

from src.brainsait.audit_logger import audit_log


class ComplianceError(Exception):
    """Raised when HIPAA/NPHIES compliance checks fail."""


async def _validate_runtime_compliance() -> None:
    """Placeholder for runtime compliance checks.

    In production this should verify encryption keys, audit sinks, RBAC, and
    TLS enforcement. Keeping the async signature allows expanding without
    breaking the decorator contract.
    """

    return None


def hipaa_compliant(
    audit_phi: bool = True,
) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    """Decorator enforcing HIPAA guardrails and audit scaffolding."""

    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            await _validate_runtime_compliance()
            try:
                return await func(*args, **kwargs)
            except Exception as exc:  # noqa: BLE001 - audit all errors
                user = kwargs.get("user")
                await audit_log(
                    action="exception",
                    user_id=getattr(user, "id", "unknown"),
                    resource_type="API",
                    resource_id=getattr(func, "__name__", "unknown"),
                    phi_involved=audit_phi,
                    meta={"error": str(exc)[:200]},
                )
                raise

        return wrapper

    return decorator
