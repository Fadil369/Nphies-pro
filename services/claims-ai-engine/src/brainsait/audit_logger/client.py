"""Centralized audit logging client (PHI-safe, structured)."""
from __future__ import annotations

from datetime import datetime
import json
import os
from typing import Any, Dict, Optional

AUDIT_SINK = os.getenv("AUDIT_SINK", "stdout")


async def audit_log(
    *,
    action: str,
    user_id: str,
    resource_type: str,
    resource_id: str,
    phi_involved: bool,
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    """Emit a structured audit log entry.

    In production deployments the sink should forward to a durable audit
    service (HTTP/gRPC/Kafka). For now we default to stdout to maintain
    transparency during development.
    """

    record = {
        "ts": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "phi_involved": phi_involved,
        "meta": meta or {},
    }

    line = json.dumps(record, ensure_ascii=False)
    if AUDIT_SINK == "stdout":
        print(line, flush=True)
    else:
        # TODO: send to external audit-service sink
        print(line, flush=True)
