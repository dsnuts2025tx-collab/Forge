import { readFileSync } from "node:fs";

const workflowPath = ".github/workflows/deploy-forge-worker.yml";
const workflow = readFileSync(workflowPath, "utf8");

const required = [
  'name: Deploy Forge Runtime',
  'branches:\n      - main',
  'environment: production',
  'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
  'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  'npx --yes wrangler@4.123.0 deploy --config wrangler.jsonc',
];

for (const fragment of required) {
  if (!workflow.includes(fragment)) {
    throw new Error(`Phantom deployment contract violation: missing ${fragment}`);
  }
}

if (/vercel/i.test(workflow)) {
  throw new Error("Phantom deployment contract violation: Vercel authority detected");
}

if (/wrangler@latest|npx\s+wrangler\s+(?!@4\.123\.0)/i.test(workflow)) {
  throw new Error("Phantom deployment contract violation: unpinned Wrangler invocation detected");
}

console.log("Phantom deployment workflow contract verified");
