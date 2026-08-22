from __future__ import annotations

ROLES = {
    "owner": {"submit", "inspect", "execute", "deploy", "halt"},
    "operator": {"submit", "inspect", "execute", "deploy"},
    "worker": {"submit", "inspect", "execute"},
    "auditor": {"inspect", "halt"},
}


def allowed(role: str, action: str) -> bool:
    return action in ROLES.get(role, set())


def require(role: str, action: str) -> None:
    if not allowed(role, action):
        raise PermissionError(f"role={role!r} cannot perform action={action!r}")
