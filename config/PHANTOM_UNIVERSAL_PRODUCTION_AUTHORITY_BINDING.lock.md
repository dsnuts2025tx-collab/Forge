# PHANTOM UNIVERSAL PRODUCTION AUTHORITY BINDING — LOCKED

Status: LOCKED
Effective: 2026-08-30

Every Phantom software component inherits the canonical production authority:
`phantom://production-authority`

Execution chain:
Mastermind → Phantom Pathway → Mortal Kombat → Phantom Production Authority → Phantom-controlled Execution Fabric → Build/Verify/Deploy/Runtime → external verification → LIVE.

Required runtime capabilities: network, runtime, deployment, DNS, TLS/HTTPS, storage, observability, verification, rollback/recovery.

Real executor values (`PHANTOM_EXECUTOR_ORIGIN`, `PHANTOM_EXECUTOR_TOKEN`, `PHANTOM_EXECUTOR_REVISION`, `FORGE_PUBLIC_ORIGIN`) are runtime/secret-manager inputs and MUST NOT be fabricated or committed to source.

LIVE requires observed production runtime, endpoint reachability, health, and evidence. Missing executor access is `BLOCKED` / `EXECUTOR_UNAVAILABLE`, never simulated LIVE.

This binding is inherited by all current and future Phantom software and workstreams.
