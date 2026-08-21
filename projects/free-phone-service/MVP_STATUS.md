# Free Phone Service — MVP Production Status

## Current milestone
Production architecture and acceptance criteria are established. Implementation remains the critical path.

## Required usable-MVP gates
- [ ] Customer enrollment and authentication
- [ ] Persisted $0 service entitlement
- [ ] Cellular-first connectivity state and selection logic
- [ ] No-Wi-Fi dependency in the core service flow
- [ ] Satellite fallback adapter interface for compatible devices/networks
- [ ] Provider adapter registry and integration health
- [ ] eSIM/SIM provisioning workflow interface
- [ ] Usage event ingestion and cost ledger
- [ ] Funding/revenue ledger and coverage calculation
- [ ] Customer portal
- [ ] Operator/admin dashboard
- [ ] Audit trail and role controls
- [ ] Automated tests
- [ ] Repeatable deployment
- [ ] Production smoke test

## Hard external blockers
Live cellular/satellite service cannot be claimed until legitimate provider agreements, credentials, approved devices/eSIM profiles, and applicable regulatory requirements are satisfied.

## Definition of usable
A customer can use the system's service experience without Wi-Fi as a prerequisite. When an authorized cellular network is available, cellular is primary. When cellular is unavailable and the device/provider supports satellite fallback, the system can select and report that fallback. The control plane remains truthful about unavailable provider integrations.
