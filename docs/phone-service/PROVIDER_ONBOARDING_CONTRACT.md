# Phone Service Completely Free — Provider Onboarding Contract

Status: ACTIVE ENGINEERING CONTRACT

This document defines the minimum evidence and configuration required to bind a real cellular provider to the Phone Service MVP. It is intentionally provider-neutral; provider-specific adapters must implement this contract without moving provider assumptions into the core service.

## Required runtime configuration

- `providerId`: stable provider identifier.
- `tokenUrl`: provider OAuth/token endpoint.
- `clientId`: production credential reference; secret is never stored in source control.
- `clientSecret`: production secret reference supplied by secret management.
- `simStatusPath`: authenticated SIM-status endpoint template.
- `connectivityResetPath`: authenticated connectivity-reset endpoint template.
- `usageEventSource`: provider event/stream endpoint or ingestion binding.
- `billingSource`: authoritative account/tariff/billing source.
- `accountId`: provider billing/account identifier where required.

## Admission prerequisites

The adapter MUST refuse production activation when any of these are absent or unverified:

1. Provider account is legitimate and authorized for the intended service.
2. Production credentials are present through secret management.
3. A real SIM/eSIM is provisioned to the account.
4. The SIM/eSIM is attached to a compatible physical device.
5. Cellular registration and data service are observed with Wi-Fi disabled.
6. Provider usage events can be received and normalized.
7. Authoritative billing/tariff data can be reconciled.
8. Funding coverage is sufficient for the service liability.

## Normalized provider contract

The adapter exposes only normalized operations/events to the core:

- `getSimStatus(simId)`
- `resetConnectivity(simId)`
- `usageEvent(event)`
- `connectivityObservation(observation)`

A provider-specific response is not considered proof of customer connectivity until the physical device observation and provider-side evidence agree.

## Cost truth rule

Customer price is always `$0` at the entitlement layer. Provider liability is tracked independently. Any provider event field labelled `cost` is non-authoritative unless the provider contract explicitly defines it as the authoritative billed amount. Final funding decisions use authoritative account/tariff/billing reconciliation.

## Security rules

- Never commit client secrets, access tokens, SIM credentials, or private keys.
- Never log bearer tokens or full credential material.
- Keep provider-specific credentials and endpoints in runtime configuration.
- Fail closed on authentication, authorization, billing, funding, or device-proof failure.

## Promotion rule

No provider adapter may be marked production-ready from mocks, fixtures, API documentation, or successful authentication alone. Production promotion requires a real provisioned SIM/eSIM, compatible physical device, Wi-Fi-disabled cellular observation, provider evidence, billing reconciliation, funding coverage, and passing deployment checks.
