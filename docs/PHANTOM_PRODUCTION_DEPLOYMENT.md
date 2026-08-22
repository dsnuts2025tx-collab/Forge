# Phantom Production Deployment

## Release standard

Production is considered live only after the deployment target is connected to the canonical `dsnuts2025tx-collab/Forge` repository, the build succeeds, runtime health is checked, and the production URL responds successfully.

## Current architecture

- Phantom Response Language (PRL) v1
- Provider-neutral inference control plane
- Phantom Family orchestration
- Proof-gated completion
- Phantom Promote advertising domain
- Campaign analytics and revenue primitives

## Deployment requirements

1. Connect the canonical Forge repository to the chosen production host.
2. Configure production secrets through the host's secret manager; never commit credentials.
3. Build and run the test suite.
4. Deploy a preview/staging build.
5. Exercise core routes and API health checks.
6. Promote only the verified build to production.
7. Verify production runtime and rollback readiness.

## Independence rule

Hosting is an implementation detail. The application must retain portable build/deploy semantics so production can move to another controlled environment without changing Phantom's core protocol or business logic.

## Advertising safety

Campaign delivery must respect inventory ownership, authorization, privacy, applicable advertising rules, and platform controls. Phantom must not claim inventory or performance it does not actually control or verify.

## Done-when

A release is complete only when live evidence proves the declared production acceptance criteria. A successful build alone is not a production launch.
