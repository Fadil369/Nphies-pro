"""Healthcare RBAC roles and scopes."""

ROLES_TO_SCOPES = {
    "doctor": ["claims.read", "claims.write", "analytics.read"],
    "nurse": ["claims.read", "analytics.read"],
    "provider_biller": [
        "claims.read",
        "claims.write",
        "analytics.read",
        "exports.write",
    ],
    "insurer_analyst": ["claims.read", "analytics.read", "exports.write"],
    "admin": [
        "claims.read",
        "claims.write",
        "analytics.read",
        "exports.write",
        "audit.read",
        "admin.manage",
    ],
    "auditor": ["audit.read", "analytics.read"],
    "patient": ["claims.read"],  # self-only filtering enforced downstream
}
