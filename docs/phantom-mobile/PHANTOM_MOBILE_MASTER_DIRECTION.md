# Phantom Mobile — Master Direction

Status: LOCKED
Authority: Phantom
Owner: Donald Long
Canonical architecture: Phantom-owned

## Mission

Build Phantom Mobile as a phone-line company and develop Phantom's own eUICC architecture, provisioning/control plane, verification system, and customer communications platform.

## Phantom-owned domains

- Company/product architecture
- Customer identity and account lifecycle
- Phone/line identity
- eUICC architecture and lifecycle
- Secure profile management
- RSP architecture
- Provisioning orchestration
- Subscriber policy
- Usage accounting
- Voice/SMS/MMS/data service orchestration
- Voicemail and unified communications
- Security and audit
- Telemetry and evidence
- Verification and recovery
- Mastermind orchestration

## eUICC direction

Phantom will design its own eUICC architecture and security model and pursue legitimate production certification.

Target architecture baseline: current GSMA consumer eSIM specifications, subject to continuous suitability review.

Production eUICC requires:
1. Secure-element hardware
2. Qualified/certified eUICC software
3. Secure manufacturing
4. Required security/functional evaluation
5. Applicable GSMA compliance/certification
6. Production credentials and certificate lifecycle
7. Physical device validation

## Fail-closed rules

- Software-only simulation never becomes LIVE.
- A test profile never becomes a production subscription without authorized production credentials.
- A missing physical eUICC never becomes HARDWARE_VERIFIED.
- Network registration requires direct device/radio evidence.
- Data service requires end-to-end data-path evidence.
- Phantom never bypasses carrier authentication, spectrum authorization, emergency requirements, certification, or network security.

## Ownership boundary

External infrastructure may be an authorized interoperability boundary, but it is never Phantom's canonical authority.

Phantom remains the control-plane, policy, verification, evidence, and lifecycle authority for its own systems.

## Master lifecycle

DESIGN -> IMPLEMENT -> HARDWARE PROTOTYPE -> TEST -> SECURITY REVIEW -> INDEPENDENT VERIFY -> CERTIFICATION -> PRODUCTION -> TELEMETRY -> RECOVERY -> CONTINUOUS IMPROVEMENT

## Production truth

PROPOSED != BUILT != TESTED != VERIFIED != CERTIFIED != DEPLOYED != LIVE.

Only evidence advances the state.

This document records the Phantom Mobile master direction requested by the owner.
