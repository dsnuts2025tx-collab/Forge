# Free Phone Service — MVP Production Status

## Current milestone
A runnable Cloudflare Worker/Durable Object control plane and a basic customer enrollment page now exist on the production branch. The software foundation supports persistent $0 entitlements, connectivity state, provider registry, usage/cost records, funding coverage, audit records, and protected admin operations.

## Implemented
- [x] Customer enrollment endpoint and basic customer page
- [x] Persisted $0 service entitlement
- [x] Cellular-first connectivity selection logic
- [x] No-Wi-Fi dependency represented and tested in the domain model
- [x] Satellite fallback policy boundary for compatible devices
- [x] Provider registry with LIVE-only connectivity claims
- [x] Usage event ingestion and cost ledger
- [x] Funding coverage calculation
- [x] Basic admin provider/funding/audit endpoints
- [x] Audit trail foundation
- [x] Automated Node test suite and deployment dry-run workflow definition

## Remaining usable-MVP gates
- [ ] Customer authentication and production identity controls
- [ ] Real provider adapter implementations and eSIM/SIM provisioning
- [ ] Real cellular integration and live no-Wi-Fi smoke test
- [ ] Real compatible satellite integration and fallback smoke test
- [ ] Full customer portal and operator dashboard
- [ ] Hardened authorization, rate limiting, idempotency, and secret management
- [ ] Verified automated CI run and deployment
- [ ] End-to-end production smoke test

## Hard external blockers
Live cellular/satellite service cannot be claimed until legitimate provider agreements, credentials, approved devices/eSIM profiles, provisioning capabilities, emergency-service requirements, and applicable regulatory/commercial requirements are satisfied.

## Definition of usable
A customer can use the service experience without Wi-Fi as a prerequisite. When an authorized cellular network is available, cellular is primary. When cellular is unavailable and the device/provider supports satellite fallback, the system can select and report that fallback. The control plane remains truthful about unavailable provider integrations.
