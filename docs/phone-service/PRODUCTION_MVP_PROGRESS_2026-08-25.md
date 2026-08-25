# Phone Service Completely Free — Production MVP Progress

Date: 2026-08-25
Status: ADVANCING / EXTERNAL INTEGRATION GATED

## Meaningful progress

### Cellular integration path
A current production-grade candidate integration surface has been identified: 1NCE provides a REST API for SIM management, monitoring, connectivity operations, quotas, SMS, events, and top-ups. Their current documentation identifies API v2 as the active management API and states that API v1 retires at the end of 2026. The project therefore targets the v2 interface rather than building against the retiring v1 surface.

The 1NCE documentation also confirms real-time event/usage streaming and SIM management through an external system, which maps cleanly to the project's first-party control-plane architecture.

### Satellite fallback path
Current Android platform APIs expose satellite state monitoring, provisioning, pointing, messaging, and location-sharing primitives on API level 36. This gives the device layer a concrete standards-aligned integration surface, while the actual service remains provider/device dependent.

Recent 2026 D2D testing by Space42/Skylo also demonstrates that standards-compliant NTN messaging/SOS can work on supported standard Android devices without an additional satellite handset in the tested environment. This is evidence that the fallback architecture is technically viable, not evidence that Forge has live satellite service.

## Architecture advancement
The MVP now treats the following as first-class production gates:

1. Customer $0 entitlement.
2. Device and identity registration.
3. Cellular provider adapter interface.
4. SIM/eSIM lifecycle interface.
5. Connectivity state machine.
6. Usage and cost ledger.
7. Funding coverage ledger.
8. Provider event/usage ingestion.
9. Admin controls and audit.
10. Cellular health and recovery actions.
11. Satellite/NTN adapter interface.
12. Device satellite capability detection.
13. No-Wi-Fi verification mode.
14. Automated tests and integration-test fixtures.
15. Deployment/readiness evidence.

## Provider integration standard
Provider adapters must expose normalized operations for authorization, SIM/eSIM lookup, provisioning/activation where supported, status, connectivity reset/recovery, usage, quotas, messaging where supported, events, and billing/top-up where supported.

Provider-specific features remain optional capabilities and must not be falsely represented as universal service.

## $0 service economics
Customer entitlement remains $0 to the customer. The platform must separately track provider cost, included allowance, sponsor/funding coverage, overage exposure, and unresolved liability. A customer being entitled to $0 does not imply the underlying provider has zero cost.

## No-Wi-Fi acceptance test
Production connectivity is not accepted from Wi-Fi-assisted tests. A real compatible device must disable Wi-Fi and demonstrate the claimed cellular capability through the authorized provider/network path. Satellite fallback requires a supported device/provider combination and an observed supported satellite operation.

## Current blockers
- No verified production carrier account/contract/credentials are present in this repository context.
- No verified eSIM/SIM provisioning event has been executed.
- No compatible production device has been independently tested with Wi-Fi disabled.
- No satellite provider agreement/credentials/device authorization is present.
- No production funding source has been established to underwrite the $0 customer entitlement.

These are intentionally BLOCKED rather than simulated.

## Immediate execution order
1. Implement the normalized provider adapter contract around current API v2 capabilities.
2. Build provider-neutral usage/event ingestion and cost/funding reconciliation.
3. Build device connectivity state and no-Wi-Fi test harness.
4. Build satellite capability detection and adapter contract.
5. Stage real provider credentials only through approved secret/configuration paths when available.
6. Run integration tests against authorized provider accounts and compatible hardware.
7. Promote only after independent verification.

## Truth rule
No carrier or satellite LIVE status may be asserted until legitimate integrations, credentials/authorization, compatible devices, applicable agreements, observed network behavior, and verification evidence exist.
