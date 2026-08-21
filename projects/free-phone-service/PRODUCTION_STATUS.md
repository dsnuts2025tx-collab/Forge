# Production Status

## Current milestone
A runnable Cloudflare Worker/Durable Object control plane and basic customer enrollment experience are now present on the production branch. The control plane persists customers and $0 entitlements, reports connectivity state, records usage/costs, calculates funding coverage, maintains a provider registry, and exposes protected admin operations.

## Implemented
- Customer enrollment and persisted $0 entitlement
- Cellular-first connectivity policy with Wi-Fi-independent state
- LIVE-only provider selection and compatible-device satellite fallback policy
- Persistent usage and expected-cost records
- Funding coverage and shortfall calculation
- Audit event foundation
- Basic customer page and JSON API
- Protected admin provider/funding/audit operations
- Automated test suite and deployment dry-run workflow definition

## Remaining production gates
- Production-grade customer authentication/identity
- Real cellular provider adapter, credentials, provisioning, and device support
- Real satellite provider/device integration
- Live no-Wi-Fi connectivity smoke test
- Full customer and operator dashboards
- Hardened authorization, rate limiting, idempotency, secret management, and abuse controls
- Verified CI execution and production deployment
- End-to-end smoke test

## External dependency gate
Live cellular or satellite service must not be represented as operational until the relevant provider agreements, credentials, provisioning capabilities, compatible devices, emergency-service requirements, and regulatory/commercial requirements are actually available.

## Definition of usable
A release is usable only when the software passes the internal gates above and a real supported connectivity path works with Wi-Fi disabled. A control-plane deployment may exist before live provider integration, but it must clearly identify provider integration as pending rather than presenting simulation as service.
