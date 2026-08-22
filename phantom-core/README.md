# Phantom Core — God Project Foundation

First-party control plane foundation for the Phantom Sovereign Infrastructure standard.

## Principles
- No required third-party control plane.
- Standard-library-only runtime for the core foundation.
- Persistent local state through SQLite.
- Explicit roles, permissions, jobs, events, and health state.
- External integrations are adapters, never authorities.
- Production claims require verification.

## Components
- `server.py` — HTTP control-plane API.
- `orchestrator.py` — job routing and worker execution.
- `storage.py` — SQLite persistence.
- `policy.py` — role and authority enforcement.

This is the foundation layer; production deployment and hardened distributed storage/compute are separate promotion stages and must be verified before being called production-ready.
