# Phone Service Completely Free — Production MVP Gates

Status: ACTIVE ENGINEERING GATE

## Purpose
Define the evidence required to promote Phone Service Completely Free from implementation to a genuinely usable production MVP.

## Capability gates

### G1 — Free entitlement
- Customer plan is `basic-free`.
- Price is `0 USD`.
- Entitlement activation is auditable.

### G2 — Wi-Fi independence
- Service operation does not require Wi-Fi.
- Real-device acceptance must be performed with Wi-Fi disabled.

### G3 — Cellular primary path
- A legitimate carrier/provider integration exists.
- Provider authorization is verified.
- Integration credentials/configuration are provisioned securely.
- Compatible device/SIM/eSIM path exists.
- Real registration, voice, SMS, and data tests pass where those capabilities are offered.

### G4 — Satellite fallback
- A legitimate compatible satellite integration exists.
- Provider authorization and applicable agreement exist.
- Compatible device capability is verified.
- Fallback behavior is observed on a real device under controlled test conditions.
- Only capabilities actually supported by the provider/device may be claimed.

### G5 — Provider abstraction
- Provider adapters implement the common interface.
- Provider state cannot become LIVE without authorization and integration evidence.
- Provider-specific credentials remain outside source control.

### G6 — Connectivity state
- Customer connectivity status exposes the selected path, provider, capabilities, reason, and observation time.
- Unknown/unavailable states remain explicit rather than being inferred as live.

### G7 — Usage, cost, and funding
- Usage events are recorded with customer/provider context.
- Expected costs are tracked.
- Funding received/committed/allocated is tracked.
- Coverage ratio and shortfall are computable.
- No claim of $0 customer cost means provider costs disappear; customer entitlement and provider economics remain separate controls.

### G8 — Administration and audit
- Provider configuration is authorization-gated.
- Customer enrollment/entitlement changes are auditable.
- Verification receipts are retained.
- Consequential actions have traceable evidence.

### G9 — Verification
- Required tests are explicit.
- Verification distinguishes UNVERIFIED, VERIFIED, and DEGRADED.
- Verification evidence is cryptographically hashed where supported.
- Mocks/simulations never establish production connectivity.

### G10 — Test and deployment
- Automated test suite passes.
- Deployment path is reproducible.
- Production configuration is separated from development fixtures.
- Rollback/recovery path exists before consequential promotion.

## Promotion rule
The MVP is not PRODUCTION until all applicable gates have authoritative evidence. Missing carrier/satellite credentials, agreements, compatible hardware, or real-device observations are blockers, not assumptions.

## Current evidence posture
Repository implementation currently provides the domain model, provider registry, provider-adapter abstraction, $0 entitlement, connectivity selection/state, usage/cost/funding accounting, verification service, tests, and deployment scripts. Live carrier/satellite operation must remain UNVERIFIED until legitimate external integration evidence is supplied and observed.
