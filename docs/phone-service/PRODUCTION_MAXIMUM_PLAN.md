# Phone Service Completely Free — Production-Maximum Plan

## Objective
Build a genuinely usable $0 phone-service platform with no Wi-Fi dependency: cellular first, compatible satellite fallback, independent verification, persistent entitlement, usage/cost accounting, funding coverage, security, auditability, deployment, and continuous recovery.

## First-party capabilities to build
- Independent verification engine with signed evidence receipts.
- Device capability and compatibility registry.
- Connectivity state machine: CELLULAR -> SATELLITE -> UNAVAILABLE.
- Wi-Fi-off acceptance gate.
- Call/SMS/data active-test harness.
- Provider-neutral carrier/eSIM orchestration interface.
- Provider-neutral satellite orchestration interface.
- SIM/eSIM lifecycle state machine: REQUESTED -> PROVISIONING -> ACTIVE -> SUSPENDED -> REVOKED.
- Usage, cost, funding, and reconciliation ledger.
- Customer $0 entitlement and eligibility service.
- Admin/operator controls with least privilege.
- Continuous health monitoring, drift detection, recovery, rollback, and audit receipts.

## External boundary
Real cellular and satellite service remains dependent on legitimate network/provider authorization, credentials, compatible hardware, provisioning support, commercial agreements, emergency-service requirements, and applicable regulation. The platform must never represent a simulated adapter as live connectivity.

## Live-provider contract
A provider may enter LIVE only when all required evidence exists:
1. provider authorization verified;
2. integration credentials present in a secret-management boundary;
3. supported device/SIM/eSIM path verified;
4. provisioning operation succeeds;
5. registration/attachment telemetry is observed;
6. required voice/SMS/data capability is observed for cellular;
7. supported satellite capability is observed for satellite;
8. usage/cost reconciliation succeeds;
9. health checks pass;
10. audit receipt is persisted.

## Production acceptance
The release gate is:
- CI green;
- deployment succeeds;
- authentication/authorization hardened;
- no secrets in source;
- customer entitlement persists;
- Wi-Fi disabled;
- real cellular registration succeeds;
- controlled call succeeds;
- controlled SMS succeeds;
- controlled data transfer succeeds;
- if cellular is unavailable and compatible satellite exists, satellite acquisition and supported message/data test succeeds;
- verification receipt is generated from observed evidence;
- recovery from a failed path is demonstrated.

## Truth rule
Configuration alone never proves connectivity. LIVE is an evidence-backed state. TEST_ONLY and mocks may validate software but can never be exposed as production network service.
