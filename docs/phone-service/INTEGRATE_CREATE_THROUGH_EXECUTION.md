# Phone Service — Integrate / Create / Through Execution Contract

Status: LOCKED EXECUTION STANDARD

## Objective
Close Phone Service capability gaps by integrating legitimate existing capabilities, creating first-party components where necessary, and going through unavoidable external network boundaries with authorized provider integrations.

## Decision order
1. INTEGRATE when an existing capability satisfies the requirement and can be controlled, secured, verified, and operated appropriately.
2. CREATE when no suitable capability exists or when first-party ownership materially improves security, reliability, portability, economics, verification, or control.
3. GO THROUGH when a requirement necessarily depends on external infrastructure such as carrier networks, spectrum, satellite networks, compatible device radios, emergency infrastructure, or regulated interfaces.
4. COMBINE approaches when that produces the strongest verified architecture.

## First-party control plane
Maintain first-party control over entitlement, identity, device capability, provider registry, provider adapters, connectivity orchestration, verification, usage/cost accounting, funding, audit, monitoring, recovery, and deployment controls.

## External boundary
External provider integrations must expose only the minimum required interface and must pass authorization, credential, compatibility, provisioning, connectivity, service-test, accounting, security, and audit gates.

## Cellular path
CELLULAR capability is promoted only after a legitimate carrier/eSIM integration is authorized, provisioned, attached on a compatible device, and real voice/SMS/data behavior is observed and verified with Wi-Fi disabled.

## Satellite path
SATELLITE fallback is promoted only after a legitimate satellite provider/device integration is authorized, provisioned/activated as required, compatible hardware is verified, supported communication is observed, and fallback behavior is tested. Satellite capabilities must never be represented as universal voice/data service when the provider/device only supports messaging or emergency communication.

## No fabricated connectivity
Mocks, simulated provider responses, test fixtures, configuration flags, or placeholder adapters may validate software architecture but can never establish LIVE or PRODUCTION connectivity.

## Execution lifecycle
DISCOVER -> CHECK EXISTING -> INTEGRATE OR CREATE -> CONNECT THROUGH AUTHORIZED BOUNDARY -> TEST -> INDEPENDENT VERIFY -> DEPLOY -> OBSERVE -> RECONCILE -> IMPROVE.

## Gap closure
For every unmet production gate, Mastermind must identify whether the correct response is integration, first-party creation, authorized external-boundary execution, or a combination. Unresolved blockers must remain explicitly BLOCKED rather than being silently reclassified as complete.

## Security and legality
No implementation may bypass carrier authentication, network authorization, spectrum controls, emergency-service requirements, payment/security safeguards, provider terms, or other lawful controls.

## Evidence
Every completed step must map to repository, test, provider, device, telemetry, deployment, or verification evidence appropriate to its claim.
