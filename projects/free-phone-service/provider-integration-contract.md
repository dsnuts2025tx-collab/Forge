# Provider Integration Contract

This contract defines the evidence and runtime boundary required before a cellular or satellite integration can be promoted from `TEST_ONLY` to `LIVE`.

## Provider states

- `TEST_ONLY`: deterministic adapter used for software tests. It must never create a live-connectivity claim.
- `PENDING_VERIFICATION`: integration metadata exists, but production authorization evidence is incomplete.
- `VERIFIED`: authorization, integration identifier, device/network compatibility, and required operational evidence have been recorded.
- `LIVE`: only a `VERIFIED` integration with an active credential/provisioning path may be used for customer production connectivity.
- `SUSPENDED`: previously verified integration is prevented from provisioning until revalidated.

## Required evidence for cellular

1. Provider identity and commercial authorization.
2. Provider API/integration identifier.
3. Credential/secret reference stored outside source control.
4. Voice capability verification.
5. SMS capability verification.
6. Data/connectivity capability verification where applicable.
7. Supported SIM/eSIM profile and compatible-device evidence.
8. Provisioning and deprovisioning behavior.
9. Usage-event and provider-cost reconciliation mapping.
10. Operational health check and failure behavior.
11. Emergency-service obligations and applicable approvals documented before activation.

## Required evidence for satellite fallback

1. Authorized satellite provider identity and commercial authorization.
2. Provider API/integration identifier or approved device integration path.
3. Credential/secret reference stored outside source control.
4. Compatible device capability evidence.
5. Fallback trigger and recovery behavior.
6. Usage/cost accounting mapping.
7. Operational health check and failure behavior.
8. Applicable emergency-service and regulatory requirements documented before activation.

## Runtime truth rules

- The adapter must return an explicit unavailable/degraded state when production credentials or required capabilities are missing.
- `LIVE` is not a display label that an operator can set without verification evidence.
- Connectivity state may report `cellular` or `satellite` only when the selected path is backed by a verified provider/device integration.
- Test fixtures may simulate provider responses but must remain visibly `TEST_ONLY`.
- Secrets are references to external secret storage; plaintext credentials must never be committed.
- Provisioning operations require idempotency/correlation keys and append audit records.

## Acceptance sequence

`TEST_ONLY` → contract tests → authorization evidence → credential reference → compatible-device verification → provisioning smoke test → usage/cost reconciliation → emergency/service review → `VERIFIED` → controlled live smoke test → `LIVE`.

A provider cannot skip an evidence step merely because the software adapter is complete.
