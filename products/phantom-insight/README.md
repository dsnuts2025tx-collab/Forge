# Phantom Insight — Launch Reality

Status: BUILDING / launch-core scaffold

This product lives inside the Phantom/Forge repository as a first-party product surface so the team can advance from a preserved, reviewable state rather than restart the project.

## Current launch-core

- Phantom Insight branded landing experience (`index.html`)
- PHIA entry point and guided conversation shell
- Realm navigation
- Journal surface
- Learning entry route (`learn.html`) redirects to the Socrates-led Learning Hub (`learning-hub.html`)
- Curriculum-driven lesson experience (`learning.html`) using `socrates-curriculum.json`
- Local browser progress and reflection storage; no account/cloud synchronization yet
- Membership/upgrade surface
- Clear boundaries between UI shell and future production AI/account/payment services

## Learning experience

1. Open `learn.html` or `learning-hub.html`.
2. Start the curriculum through the Learning Hub.
3. Complete a lesson, respond to its Socratic questions, and save progress locally in that browser.
4. The current implementation is a starter learning journey. It does not claim a live AI tutor, server-side learner accounts, or cross-device synchronization.

## Local validation

From this directory, run:

```sh
node validate-curriculum.mjs
node smoke-test.mjs
```

These scripts perform static curriculum/source checks. They do not substitute for browser testing, integration testing, security review, or production deployment verification. No test-pass claim is made until the commands are actually executed in a Node environment.

## Operating rule

Advance continuously from this verified source tree. Do not replace working capability unnecessarily. Any consequential production deployment must pass the applicable security, privacy, compatibility, accessibility, integration, and release gates.

## Next integration targets

1. Integrate the Learning Hub link into the main homepage navigation.
2. Execute curriculum validation and smoke checks; fix and rerun any failures.
3. Browser-test the full learner journey on desktop and mobile.
4. Connect the real PHIA runtime.
5. Connect authentication and persistent user state.
6. Connect journal persistence.
7. Connect authoritative membership/payment state.
8. Add production observability and health checks.
9. Stage and verify the complete customer path before public production release.
