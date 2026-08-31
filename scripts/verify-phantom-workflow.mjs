import { readFileSync } from 'node:fs';

const workflowPath = '.github/workflows/phantom-verify.yml';
const packagePath = 'package.json';
const bindingPath = 'config/PHANTOM_UNIVERSAL_PRODUCTION_AUTHORITY_BINDING.lock.md';

const workflow = readFileSync(workflowPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts ?? {};
const binding = readFileSync(bindingPath, 'utf8');

const requiredCommands = [
  'npm run check',
  'npm run phantom:overdrive:verify',
  'npm run phantom:capability-compiler:self-test',
  'npm run phone-service:self-test',
  'npm run phantom:production-control:self-test',
  'npm run phantom:production-authority:verify',
];

for (const command of requiredCommands) {
  if (!workflow.includes(`- run: ${command}`)) {
    throw new Error(`Phantom proof workflow missing required gate: ${command}`);
  }
}

const scriptNames = [
  'check',
  'phantom:overdrive:verify',
  'phantom:capability-compiler:self-test',
  'phone-service:self-test',
  'phantom:production-control:self-test',
  'phantom:production-authority:verify',
];

for (const name of scriptNames) {
  if (typeof scripts[name] !== 'string' || scripts[name].trim() === '') {
    throw new Error(`package.json missing required proof script: ${name}`);
  }
}

for (const marker of [
  'Status: LOCKED',
  '`phantom://production-authority`',
  '`PHANTOM_EXECUTOR_ORIGIN`',
  '`PHANTOM_EXECUTOR_TOKEN`',
  '`PHANTOM_EXECUTOR_REVISION`',
  '`FORGE_PUBLIC_ORIGIN`',
  'BLOCKED` / `EXECUTOR_UNAVAILABLE',
]) {
  if (!binding.includes(marker)) {
    throw new Error(`Universal production authority binding missing required marker: ${marker}`);
  }
}

if (/vercel/i.test(workflow)) {
  throw new Error('Phantom proof workflow must not declare Vercel authority');
}

console.log(`Phantom proof workflow verification: PASS (${workflowPath})`);
