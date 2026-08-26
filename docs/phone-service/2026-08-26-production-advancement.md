# Phone Service Completely Free — Production Advancement — 2026-08-26

## Meaningful verified progress

### Cellular integration baseline
1NCE's current documentation confirms API v2 is the forward integration baseline. API v1 must be migrated before its December 31, 2026 retirement deadline. v2 supports SIM listing/status/update, connectivity reset, events, data/SMS quota, SMS, and top-up operations. OAuth2 client credentials are required, with dedicated Management API credentials rather than an Owner role.

### Usage and connectivity telemetry
The 1NCE Data Streamer is the preferred automation path for ongoing monitoring. Current documentation exposes connectivity/session events and usage events, including endpoint/device identifiers, SIM/IMSI, operator, timestamps, traffic type, volume, and radio-access-technology details. Usage-event cost fields are explicitly legacy/non-authoritative and must not be treated as the real-world provider bill.

### Architecture decision
Phone Service remains provider-neutral. The 1NCE adapter is an implementation candidate, not a production dependency until a legitimate account, credentials, provisioned SIM/eSIM, compatible physical device, and verified commercial terms exist.

### Satellite fallback
Android's current carrier configuration exposes NTN/satellite roaming capability information on supported API levels. Satellite remains a fallback transport only after carrier/provider entitlement, compatible hardware, agreements, and observed no-Wi-Fi fallback behavior are proven.

## Production gates
- Customer entitlement is $0.
- Underlying provider/network costs remain separately accounted and require verified funding coverage.
- Wi-Fi is not accepted as the primary connectivity path for the production acceptance test.
- Real carrier connectivity requires legitimate credentials, provisioning, compatible hardware, and observed network attachment.
- Real satellite connectivity requires legitimate entitlement/provider agreement, compatible hardware, and observed fallback behavior.
- Provider documentation, mocks, simulations, or API schemas alone cannot promote a transport to LIVE.
- Usage ledger must reconcile provider usage records against authoritative billing/tariff/account data before declaring cost coverage verified.
- Deployment requires health checks, telemetry, auditability, rollback, and recovery evidence.

## Current blocker set
No production carrier credentials/account, provisioned physical SIM/eSIM, compatible device attachment evidence, satellite provider/carrier agreement, verified satellite hardware/entitlement, or verified production funding source is present in the available Forge evidence. Therefore the Phone Service is NOT production-live.

## Next execution priority
Build/test the provider-neutral cellular adapter contract and normalized event/usage ledger using sandbox/mock fixtures only; prepare the production credential and device acceptance harness without claiming live connectivity. Then validate authoritative billing reconciliation and funding controls once legitimate commercial access exists.
