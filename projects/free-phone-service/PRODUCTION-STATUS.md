# Free Phone Service — Production Status

Date: 2026-08-21

## Current milestone
Runnable Cloudflare Worker control-plane foundation exists on `feature/free-phone-service`.

## Verified by code inspection
- Persistent customer records via Durable Object storage.
- Persistent $0 basic entitlement.
- Connectivity state model with `wifiRequired: false`.
- Cellular-first selection and satellite fallback selection.
- Provider selection is restricted to providers explicitly marked `LIVE`.
- Usage and provider-cost records.
- Funding coverage calculation and shortfall reporting.
- Admin-token protected provider/funding/usage/audit endpoints.
- Customer enrollment UI and health endpoint.
- Node test suite covering entitlement, no-Wi-Fi state behavior, cellular priority, satellite fallback, usage persistence, and funding shortfall.

## Not yet verified
- Successful CI run for the current head commit.
- Live deployment smoke test.
- Real carrier provisioning and live cellular traffic.
- Real satellite provisioning and live satellite traffic.
- Production-grade identity/authentication beyond the current admin token mechanism.
- End-to-end phone calls/SMS/data over an authorized network.
- Production funding source and carrier/satellite commercial agreements.

## Release rule
Do not call the product usable phone service until the software is deployed and the real connectivity path is verified with an authorized provider and compatible device. Wi-Fi must be disabled during the cellular acceptance test. Satellite is only a fallback when a compatible device and authorized satellite provider are genuinely available.
