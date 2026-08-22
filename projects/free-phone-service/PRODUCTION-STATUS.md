# Free Phone Service — Production Status

Date: 2026-08-21

## Current milestone
Runnable Cloudflare Worker/Durable Object control-plane foundation exists on `feature/free-phone-service`, with a provider-adapter runtime contract, customer enrollment UI, persistent $0 entitlement, usage/cost accounting, funding coverage, and regression tests.

## Meaningful progress
- Customer enrollment and $0 entitlement persistence are implemented.
- Connectivity policy enforces cellular-first selection and compatible satellite fallback without a Wi-Fi requirement.
- Provider selection is restricted to explicitly `LIVE` integrations and cellular phone service requires voice + SMS capability.
- Provider adapters refuse non-live integrations and expose an explicit failure until authorized provisioning is implemented.
- Usage and provider-cost records plus funding coverage/shortfall calculation exist.
- Protected admin operations exist for providers, funding, usage, and audit access.
- Automated Node tests cover entitlement persistence, no-Wi-Fi behavior, cellular priority, satellite fallback, usage persistence, funding shortfall, and provider truth gates.
- GitHub Actions workflow definition exists for tests and Cloudflare deployment dry-run.

## Current blockers
- The current head has no verified CI result available through the connected GitHub workflow inspection, so automated build/deploy verification is not yet proven.
- Real carrier provisioning/eSIM-SIM integration is not implemented.
- Real satellite provisioning is not implemented.
- Production customer authentication/identity is not yet hardened beyond the current basic control-plane mechanisms.
- Full customer/operator portals and production security hardening remain.
- No authorized carrier/satellite agreement, credential set, approved device path, or live traffic test is being represented as available.

## Release rule
Do not call this usable phone service until the software is deployed and real connectivity is verified with an authorized provider and compatible device. Wi-Fi must be disabled during the cellular acceptance test. Satellite is only a fallback when a compatible device and authorized satellite provider genuinely support it.
