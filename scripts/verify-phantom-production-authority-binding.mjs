import { readFileSync } from 'node:fs';

const bindingPath = 'config/PHANTOM_UNIVERSAL_PRODUCTION_AUTHORITY_BINDING.lock.md';
const binding = readFileSync(bindingPath, 'utf8');

const requiredMarkers = [
  'Status: LOCKED',
  '`phantom://production-authority`',
  'Mastermind → Phantom Pathway → Mortal Kombat → Phantom Production Authority → Phantom-controlled Execution Fabric',
  'network, runtime, deployment, DNS, TLS/HTTPS, storage, observability, verification, rollback/recovery',
  '`PHANTOM_EXECUTOR_ORIGIN`',
  '`PHANTOM_EXECUTOR_TOKEN`',
  '`PHANTOM_EXECUTOR_REVISION`',
  '`FORGE_PUBLIC_ORIGIN`',
  'MUST NOT be fabricated or committed to source',
  'BLOCKED` / `EXECUTOR_UNAVAILABLE`',
];

for (const marker of requiredMarkers) {
  if (!binding.includes(marker)) {
    throw new Error(`Phantom production authority binding missing required marker: ${marker}`);
  }
}

if (/PHANTOM_EXECUTOR_TOKEN\s*[:=]\s*[^`\s]+/i.test(binding)) {
  throw new Error('Phantom production authority binding must not contain a concrete executor token.');
}

console.log(`Phantom universal production authority binding verification: PASS (${bindingPath})`);
