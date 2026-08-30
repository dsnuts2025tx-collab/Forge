import { readFileSync } from 'node:fs';

const path = 'PHANTOM_FAMILY_OVERDRIVE.md';
const text = readFileSync(path, 'utf8');

const required = [
  '# Phantom Family Overdrive Standard',
  '**Status: LOCKED**',
  '**Authority: Phantom / Forge Operating Standard**',
  '**BUILD → ADDRESS → CORRECT → UPGRADE → VERIFY → ESCALATE → REPEAT**',
  '**PHANTOM INSIGHT → COMPLETE → VERIFIED → PRODUCTION-READY → DEPLOYED → LIVE → REVENUE-CAPABLE**',
  '## Governance Boundary',
  '## Verification Rule',
  '## Anti-Theater Rule',
  '**DISCOVER → PRIORITIZE → BUILD/FIX → TEST → INTEGRATE → VERIFY → RELEASE WHEN AUTHORIZED → OBSERVE → IMPROVE → REPEAT**',
  '**LOCKED.**',
];

for (const marker of required) {
  if (!text.includes(marker)) throw new Error(`overdrive standard missing required invariant: ${marker}`);
}

const forbidden = ['bypass security', 'skip verification', 'uncontrolled mutation'];
for (const marker of forbidden) {
  if (text.toLowerCase().includes(marker)) throw new Error(`overdrive standard contains forbidden instruction: ${marker}`);
}

console.log(`overdrive standard verification: PASS (${path})`);
