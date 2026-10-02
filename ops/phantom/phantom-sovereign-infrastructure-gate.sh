#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
mkdir -p "$STATE"
touch "$STATE/artifact-registry.ndjson"

"$ROOT/ops/phantom/phantom-ip-green-gate.sh"
"$ROOT/ops/phantom/phantom-green-gate.sh"
"$ROOT/ops/phantom/phantom-provenance-verify.sh"

cat > "$STATE/sovereign-infrastructure-state.json" <<JSON
{
  "system":"Phantom Sovereign Infrastructure Fabric",
  "owner":"Donald Long III / Phantom",
  "ip_governance":"GREEN",
  "control_plane":"GREEN",
  "provenance_integrity":"GREEN",
  "third_party_production_authority":false,
  "public_live":false,
  "external_proof":false,
  "physical_substrate":"EVIDENCE_GATED",
  "anti_false_green":true,
  "updated_at_utc":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "PHANTOM_SOVEREIGN_INFRASTRUCTURE_GREEN"
