# Free Phone Service — Production Status

Date: 2026-08-21

## Current milestone
Runnable Cloudflare Worker/Durable Object control-plane foundation exists on `feature/free-phone-service`, with an explicit provider-adapter runtime contract, regression tests, and initial enrollment abuse/idempotency protections.

## Implemented
- Persistent customer records via Durable Object storage.
- Persistent $0 basic entitlement.
- Connectivity state model with `wifiRequired: false`.
- Cellular-first selection and satellite fallback selection.
- Provider selection restricted to providers explicitly marked `LIVE` and, for cellular phone service, voice + SMS capable.
- Explicit provider-adapter runtime contract that refuses to impersonate non-live integrations.
- Usage and provider-cost records.
- Funding coverage calculation and shortfall reporting.
- Admin-token protected provider/funding/usage/audit endpoints.
- Customer enrollment UI and health endpoint.
- Enrollment rate limiting and 24-hour idempotency-key protection to reduce duplicate customer creation and basic abuse.
- Node test suite covering entitlement, no-Wi-Fi state behavior, cellular priority, satellite fallback, usage persistence, funding shortfall, and provider-adapter truth gates.
- GitHub Actions workflow definition for automated tests and Cloudflare deployment dry-run.

## Not yet verified
- Successful CI run for the current head commit.
- Live deployment smoke test.
- Real carrier provisioning and live cellular traffic.
- Real satellite provisioning and live satellite traffic.
- Production-grade customer identity/authentication beyond the current admin token mechanism.
- End-to-end phone calls/SMS/data over an authorized network.
- Production funding source and carrier/satellite commercial agreements.

## Release rule
Do not call the product usable phone service until the software is deployed and the real connectivity path is verified with an authorized provider and compatible device. Wi-Fi must be disabled during the cellular acceptance test. Satellite is only a fallback when a compatible device and authorized satellite provider are genuinely available.