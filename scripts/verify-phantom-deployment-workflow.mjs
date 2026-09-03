import { readFileSync } from "node:fs";

const workflowPath = ".github/workflows/deploy-forge-worker.yml";
const configPath = "wrangler.jsonc";
const workflow = readFileSync(workflowPath, "utf8");
const config = readFileSync(configPath, "utf8");

const requiredWorkflow = [
  'name: Deploy Forge Runtime',
  'branches:\n      - main',
  "if: github.ref == 'refs/heads/main'",
  'environment: production',
  'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
  'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  'npx --yes wrangler@4.123.0 deploy --config wrangler.jsonc',
  'name: Download verified Forge package',
  'name: Verify packaged runtime',
  'working-directory: dist',
];

for (const fragment of requiredWorkflow) {
  if (!workflow.includes(fragment)) {
    throw new Error(`Phantom deployment contract violation: missing ${fragment}`);
  }
}

const requiredConfig = [
  '"name": "phantom-forge-engine"',
  '"main": "./runtime-entry.js"',
  '"workers_dev": true',
  '"directory": "."',
  '"binding": "ASSETS"',
  '"run_worker_first": true',
  '"name": "FORGE_STATE"',
  '"class_name": "ForgeState"',
  '"tag": "v1"',
  '"new_sqlite_classes": ["ForgeState"]',
];

for (const fragment of requiredConfig) {
  if (!config.includes(fragment)) {
    throw new Error(`Phantom deployment contract violation: missing wrangler config invariant ${fragment}`);
  }
}

if (/vercel/i.test(workflow) || /vercel/i.test(config)) {
  throw new Error("Phantom deployment contract violation: Vercel authority detected");
}

if (/wrangler@latest|npx\s+wrangler\s+(?!@4\.123\.0)/i.test(workflow)) {
  throw new Error("Phantom deployment contract violation: unpinned Wrangler invocation detected");
}

console.log("Phantom deployment workflow and runtime contract verified");
