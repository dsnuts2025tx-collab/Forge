# Phantom Mastermind — Unified Engineering & Memory Operating Specification

Status: FOUNDATIONAL DESIGN / EXTERNAL STAGING COPY
Date: 2026-09-02

> This repository copy is an external staging artifact only. It does not make GitHub the canonical Phantom source, control plane, build authority, deployment authority, or memory authority. The canonical implementation belongs inside the Phantom-controlled system.

## 1. Objective

Keep Phantom Mastermind and every authorized Phantom engineering capability continuously aligned around one authoritative configuration, one durable memory fabric, one execution pathway, and one evidence trail.

Core chain:

USER INTENT
→ INTENT TRANSLATOR
→ MASTERmind AUTHORITY
→ PHANTOM PATHWAY
→ GADGET FABRIC / WORKERS
→ EXECUTION
→ VERIFICATION
→ PHANTOM FOOTPRINTS
→ CANONICAL MEMORY
→ STATE / RECOVERY

## 2. Capabilities

### Engineering Detective

Purpose: investigate unknown, broken, degraded, or suspicious software/infrastructure behavior.

Required functions:
- inspect source, configuration, runtime state, logs, traces, metrics, artifacts, dependency graph, and evidence
- reproduce defects in an isolated environment where feasible
- form hypotheses and test them against observable evidence
- identify root cause, contributing factors, blast radius, and regression risk
- produce a repair plan before mutation when risk warrants it
- preserve evidence before destructive remediation

### Engineering EMT

Purpose: emergency stabilization and repair.

Required functions:
- receive high-priority incidents from Mastermind
- immediately classify severity and affected capability
- freeze unsafe mutation paths
- create a recovery checkpoint
- isolate the failing component
- apply the smallest safe repair or rollback
- run health/readiness/functional/security verification
- restore service only after evidence-backed verification
- write an incident footprint and recovery record

EMT is fast, not reckless. It never bypasses authority, authentication, authorization, artifact identity, evidence, or fail-closed controls.

### Mastermind Intent Translator

Purpose: convert natural-language user instructions into explicit, structured Mastermind directives without losing intent.

Pipeline:
USER MESSAGE
→ PARSE
→ NORMALIZE
→ EXTRACT OBJECTIVE / CONSTRAINTS / PRIORITY
→ RESOLVE AGAINST LOCKED CONFIGURATION
→ IDENTIFY REQUIRED CAPABILITIES
→ PRODUCE MASTERmind DIRECTIVE
→ EXECUTE THROUGH PATHWAY
→ REPORT VERIFIED RESULT

The translator must preserve negative constraints such as "do not", "never", "private", "locked", and "no external canonical dependency".

### Mass Memory Fabric

Purpose: make relevant Phantom knowledge available to Mastermind and authorized workers without requiring the user to restate the project history.

Memory layers:
1. Canonical configuration — immutable approved rules and invariants.
2. Architecture knowledge — components, interfaces, contracts, dependencies, ownership.
3. Project state — current releases, deployments, incidents, work in progress, blockers.
4. Evidence — footprints, verification records, artifact identities, test results.
5. Historical decisions — superseded decisions retained with validity windows.
6. Operational memory — incidents, repairs, regressions, recovery patterns.
7. Research memory — externally sourced findings with provenance and confidence.
8. Working context — task-scoped temporary memory with expiration.

Memory requirements:
- provenance on every durable record
- timestamps and validity state
- source/reference identity
- confidence where inference is involved
- conflict detection rather than silent overwrite
- immutable history for locked decisions
- semantic + keyword retrieval
- temporal retrieval
- entity/component relationships
- compaction/summarization with links back to source evidence
- export/import and disaster recovery
- access control by capability and data classification
- no secret material in ordinary model context

## 3. Always-Aligned Configuration

Create a single versioned configuration graph consumed by Mastermind, Pathway, Footprints, workers, verification, runtime, security, and recovery.

Every capability declares:
- capability ID
- owner/authority
- allowed operations
- required permissions
- inputs/outputs
- dependencies
- safety gates
- evidence requirements
- recovery behavior
- version
- compatibility range

Configuration drift is a first-class incident.

## 4. Worker Fabric

Workers are specialized execution units under Mastermind authority. Existing team/Seven Dwarfs roles remain subordinate to the same registry and shared configuration rather than maintaining independent rule sets.

Workers may cover:
- architecture
- engineering
- build
- QA
- security
- malware defense
- research
- adversarial testing
- deployment
- observability
- incident response
- rollback
- evidence
- audit

Worker lifecycle:
CONCEPT → SPECIFIED → PROTOTYPE → BUILT → LOCKED

RETIRED is preservation, not deletion.

## 5. Gadget Fabric Integration

The Gadget Fabric is the policy-controlled capability layer for discovering, authorizing, executing, observing, verifying, evidencing, auditing, recovering, and locking operations.

External interoperability systems are boundary adapters. They do not become Phantom authority merely by being connected.

## 6. Security and Identity

Every human, worker, agent, service, and runtime actor receives a distinct identity and capability scope.

Required controls:
- least privilege
- short-lived/action-scoped authorization where feasible
- replay protection
- request identity
- artifact identity
- input validation
- sandbox/isolation for untrusted code
- network policy
- secret separation from model-generated code
- public/control-plane separation
- fail closed on missing authority or proof

## 7. Verification Standard

No capability may report BUILT, DEPLOYED, LIVE, FIXED, or RECOVERED without evidence appropriate to that claim.

Minimum production promotion evidence:
- source/provenance
- dependency review
- reproducible build or equivalent
- artifact identity/checksum
- functional tests
- security checks
- runtime health/readiness
- deployment event
- external reachability where public exposure is claimed
- live verification
- Footprint

## 8. Emergency Protocol

DETECT
→ CLASSIFY
→ FREEZE UNSAFE ACTIONS
→ PRESERVE EVIDENCE
→ SNAPSHOT / CHECKPOINT
→ DIAGNOSE
→ REPAIR OR ROLLBACK
→ VERIFY
→ RESTORE
→ RECORD
→ LEARN
→ UPDATE MEMORY / REGRESSION TEST

No emergency path bypasses foundational Phantom invariants.

## 9. Research Upgrade Loop

Research is continuously evaluated for useful improvements in:
- agent orchestration
- persistent memory
- sandbox execution
- coding agents
- MCP interoperability
- observability
- agent identity and authorization
- evaluation and regression testing
- resilience and durable execution

External findings are marked as RESEARCH, evaluated, and only promoted into LOCKED configuration after compatibility/security/policy review.

## 10. Canonical Authority

Mastermind remains the highest operational authority within the Phantom ecosystem. Phantom Pathway remains the canonical execution chain. Phantom Footprints remains the evidence/control record. Production Operations remains a first-class Mastermind capability.

The implementation must remain Phantom-controlled even when external tools or providers are used as bounded interoperability adapters.
