# G PRODUCT LAUNCH STANDARD — LOCKED

## Purpose

G is the human-to-system translation and conducting layer for product creation and launch. A user command such as `Launch Insight Live` or `Launch Insight App` is a product outcome request, not a request to merely publish the current repository state.

## Required semantics

`Launch <product> Live` MUST mean:

1. resolve the canonical product/project;
2. hard-check actual state before planning;
3. distinguish planned, implemented, tested, verified, deployed, live, and operational state;
4. reuse and compose existing capabilities before building new ones;
5. assess the competitive/technical frontier relevant to the product;
6. implement the strongest validated production-quality experience supported by authorized resources;
7. test and independently verify;
8. deploy through the canonical production-control path;
9. prove live health and the applicable customer journey;
10. preserve durable evidence and continue bounded observation/reconciliation/improvement.

`Launch <product> App` has the same standard for a real production application, including applicable authentication/session, persistence/data integrity, security/privacy, reliability/recovery, and core customer journey gates.

## G boundary

G translates and conducts. G does not self-authorize production, bypass Phantom controls, or promote an unverified result. The canonical path remains:

`G → Mastermind → Phantom → Forge → Verification → Phantom → Mastermind → G`

## Truth rule

A commit, preview, static shell, deployment attempt, or documentation entry is not proof that a website or application is live. “LIVE/PRODUCTION-VERIFIED” requires evidence of the actual production endpoint and applicable customer journey.

## Quality rule

“State of the art” is an objective to maximize validated capability, not an unsupported claim. The system must define relevant criteria, benchmark when useful, and record evidence for material quality decisions.

## Autonomy rule

After G translates a launch command, Mastermind/Forge/Verification should continue ordinary authorized work without requiring G or the user to babysit each step. Escalate only at genuine authority boundaries, hard safety/security/legal/compliance conflicts, irreversible consequential actions, integrity failures, conflicting authoritative requirements, or genuine foundational gaps.

## No-loop rule

If a gate fails: locate the exact seam → reuse/repair → implement → test → verify → record → continue. Do not restart completed work or repeatedly ask for information already present in canonical state.

## Authority

The user's explicit ruling remains highest project authority. Phantom remains sovereign governance/control and production truth; Mastermind orchestrates and implements; Forge executes; Verification proves; G translates/conducts.
