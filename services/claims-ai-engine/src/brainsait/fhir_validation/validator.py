"""Lightweight FHIR R4 validation helpers."""
from __future__ import annotations

from typing import Any, Dict, List, Tuple


def validate_fhir_claim_bundle(bundle: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate a minimal FHIR Claim bundle (stubbed rules)."""

    errors: List[str] = []

    if not bundle or bundle.get("resourceType") != "Bundle":
        errors.append("Bundle.resourceType must be 'Bundle'")

    entries = bundle.get("entry", [])
    if not entries:
        errors.append("Bundle.entry is required")

    resource_types = {
        entry.get("resource", {}).get("resourceType")
        for entry in entries
        if "resource" in entry
    }
    if "Claim" not in resource_types:
        errors.append("Bundle must include a Claim resource")

    if errors:
        return False, errors
    return True, []
