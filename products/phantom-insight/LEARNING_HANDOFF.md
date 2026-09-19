# Insight Learning — Implementation Handoff

## What is present

- `index.html` — Insight landing experience.
- `content-universe.json` — content/realm map.
- `socrates-curriculum.json` — structured starter curriculum.
- `learning.html` — Socrates-led lesson viewer with response saving and completion tracking in browser `localStorage`.
- `validate-curriculum.mjs` — curriculum structure validation script.
- `smoke-test.mjs` — static smoke checks for the learning page and curriculum.

## Run locally

From this directory, start a static HTTP server (for example, `python3 -m http.server 8000`) and open `http://localhost:8000/learning.html`. A server is required because the learning page loads its JSON curriculum with `fetch()`.

Run the repository checks from this directory:

```sh
node validate-curriculum.mjs
node smoke-test.mjs
```

These commands are documented but have **not been confirmed as passing** merely by committing the scripts. Run them in a Node.js environment and record the actual output before marking the learning experience verified.

## Current boundaries

- Progress and reflections are stored only in the current browser/device; no authentication or cloud synchronization is implemented here.
- The reflection UI is not a live AI tutor and does not generate personalized AI answers.
- No browser end-to-end test, production deployment, TLS/hostname validation, or public-live verification is asserted by this handoff.
- Keep claims about astrology, divination, and spiritual traditions appropriately framed as cultural traditions, symbolic systems, or reflective practices rather than scientifically established prediction.

## Verification sequence

1. Run both Node scripts and preserve their real exit codes/output.
2. Serve the directory over HTTP and check the course list, lesson navigation, response save, completion state, reset confirmation, and mobile layout in a browser.
3. Confirm the learning entry is discoverable from the main Insight navigation before calling it integrated.
4. Complete the approved Phantom deployment and security gates before describing Insight as publicly live.
