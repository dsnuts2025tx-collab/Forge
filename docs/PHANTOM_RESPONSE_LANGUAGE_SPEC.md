# Phantom Response Language (PRL) — v1

## Purpose

PRL is a compact, machine-readable response language for Phantom's custom AI infrastructure. It is designed to make model/workforce communication deterministic, inspectable, streamable, and independent of any single model provider.

PRL is **not** a replacement for ordinary customer-facing language. It is an internal protocol between Master Mind, Family workers, the Proof Engine, the Orchestrator, and execution services.

## Design goals

- Deterministic mission state transitions
- Explicit authority and approval boundaries
- Structured tool/action requests
- Evidence-first completion
- Error and retry semantics
- Streaming-friendly events
- Model/provider neutrality
- Human-readable debugging
- Versioned evolution

## Envelope

Every PRL message uses this logical envelope:

```text
@PRL/1
KIND <MISSION|PLAN|TASK|ACTION|RESULT|PROOF|EVENT|ERROR|HANDOFF>
ID <unique-id>
PARENT <id-or-none>
ACTOR <master-mind|worker-id|system|human>
CAP <capability>
STATE <state>
BODY <structured fields>
SIG <optional-integrity-signature>
END
```

Implementations may serialize the envelope as JSON, line protocol, binary frames, or another transport without changing the semantic contract.

## Core states

```text
PROPOSED
PLANNED
AUTHORIZED
ENGAGED
EXECUTING
WAITING
CHALLENGED
TESTING
VERIFYING
PROVEN
DEPLOYING
DEPLOYED
MEASURING
LEARNING
IMPROVING
COMPLETED
FAILED
BLOCKED
CANCELLED
```

## Core verbs

```text
PLAN      create or revise a mission plan
DELEGATE  assign work to a worker
ENGAGE    activate a worker/capability
CALL      request a tool/service action
CHECK     request a test or health check
CHALLENGE submit an adversarial review
PROVE     attach evidence supporting an outcome
HANDOFF   transfer execution ownership
WAIT      suspend until an event/time/dependency
RETRY     retry a bounded failed operation
PROMOTE   move a capability through its release gate
ROLLBACK  return to a known-good version
LEARN     record reusable mission knowledge
```

## Example mission

```text
@PRL/1
KIND MISSION
ID M-1042
PARENT none
ACTOR master-mind
CAP product-build
STATE PROPOSED
BODY
OBJECTIVE "Build and release the requested customer application"
SUCCESS "Live endpoint responds; critical workflow passes; evidence attached"
RISK medium
END
```

Master Mind can then emit:

```text
@PRL/1
KIND PLAN
ID P-1042
PARENT M-1042
ACTOR master-mind
CAP orchestration
STATE PLANNED
BODY
TASK T1 architect
TASK T2 engineer
TASK T3 security
TASK T4 qa
DEPENDENCIES T2:T1 T4:T2,T3
GATE production-human-approval
END
```

A worker response:

```text
@PRL/1
KIND RESULT
ID R-77
PARENT T2
ACTOR engineer
CAP implementation
STATE PROVEN
BODY
ARTIFACT src/app
TESTS 18/18
EVIDENCE e-884
SUMMARY "Implementation passes the defined acceptance tests"
END
```

## Proof contract

A result MUST NOT enter `PROVEN` unless it contains sufficient evidence for its declared success criteria. A mere model generation, tool call, or worker assertion is insufficient.

Proof records should include:

- success criteria
- tests/checks executed
- observed results
- artifact/version identifiers
- timestamps
- actor
- confidence/limitations
- optional human approval

## Authority model

PRL separates **capability** from **authority**. A worker may possess a capability without having authority to perform a high-impact action.

Recommended authority classes:

```text
OBSERVE
SUGGEST
BUILD
TEST
DEPLOY_STAGING
DEPLOY_PRODUCTION
FINANCIAL_ACTION
SECURITY_ADMIN
SYSTEM_ADMIN
```

High-impact actions require an explicit policy decision and, where configured, a human approval gate.

## Streaming events

Long-running work emits events instead of forcing clients to poll:

```text
MISSION_ACCEPTED
PLAN_READY
WORKER_ENGAGED
TASK_STARTED
TASK_PROGRESS
TASK_COMPLETED
TASK_FAILED
CHALLENGE_RAISED
PROOF_ATTACHED
GATE_REQUIRED
DEPLOY_STARTED
DEPLOY_VERIFIED
MISSION_COMPLETED
```

## Capability Factory extension

When Phantom lacks a capability, the protocol supports:

```text
CAPABILITY_REQUEST
→ SPECIFY
→ BUILD
→ SANDBOX
→ ATTACK
→ TEST
→ SECURITY_REVIEW
→ PROVE
→ PROMOTE
```

A capability is not promoted merely because it was generated. It must pass the configured proof gates.

## Compatibility

PRL should sit above transport and model-specific protocols. Adapters may translate PRL to/from provider APIs, local models, remote workers, or future Phantom-native inference engines.

The Phantom platform therefore owns the **semantic contract** even when the underlying inference engine changes.

## Versioning

The major version changes only for incompatible semantic changes. Minor revisions may add optional fields, verbs, or event types. Unknown optional fields must be ignored safely; unknown mandatory semantics must fail closed with an `ERROR` message.

## Guiding principle

> Generated is not accomplished. A response becomes a result only when Phantom can prove what happened.
