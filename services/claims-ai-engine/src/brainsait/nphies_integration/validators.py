"""Saudi NPHIES format checks (ID/Iqama)."""
from __future__ import annotations

import re

_SA_ID = re.compile(r"^[12]\d{9}$")  # 10 digits starting with 1 or 2


def validate_saudi_patient_id(value: str | None) -> bool:
    """Validate Saudi National ID/Iqama format (syntactic check only)."""

    if value is None:
        return False
    return bool(_SA_ID.match(value))
