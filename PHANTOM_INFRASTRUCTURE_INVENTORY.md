# PHANTOM INFRASTRUCTURE INVENTORY

**Status: LOCKED**

This inventory is the canonical record of real Phantom infrastructure. A resource may not be marked operational solely because a configuration exists.

## Required resource record

- resource_id
- resource_type
- owner
- environment
- region/location
- service_identity
- endpoint
- dependency_ids
- health_status
- version
- artifact/release_id
- secret_reference (never secret value)
- backup_method
- recovery_method
- last_verified_at
- verification_evidence
- lifecycle_status

## Required states

PLANNED → PROVISIONING → PROVISIONED → CONFIGURED → VERIFIED → OPERATIONAL → RETIRED

Failed resources use FAILED and must have an owner and remediation record.

## Authority rules

- Mastermind owns desired state and policy.
- Big Daddy Infrastructure Provisioner creates/reconciles resources within authorization.
- Phantom Production Control Surface owns release/deployment orchestration.
- Phantom Producer performs controlled releases.
- SNITCH independently verifies actual state.
- Big Daddy Motherboard Specialist protects foundational architecture.
- Big Daddy Librarian maintains canonical records and evidence references.

## Minimum production inventory

- Phantom execution realm
- worker runtime
- build workers
- SNITCH workers
- deployment worker
- production compute
- staging compute
- database
- object/media storage
- event/analytics storage
- private network
- public ingress
- DNS authority
- TLS/certificate authority
- secrets/key authority
- artifact registry
- observability stack
- backup system
- recovery system
- Phantom production endpoint

## Truth rule

If a resource has no machine-verifiable provisioning and health evidence, its status must not be OPERATIONAL.
