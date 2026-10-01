#!/usr/bin/env bash
set -Eeuo pipefail
# Phantom first-party project lifecycle.
# Owner: Donald Long III / Phantom.
# This source establishes the mandatory lifecycle boundary; physical execution remains evidence-gated.

ROOT="${PHANTOM_ROOT:-$(pwd)}"
CONTRACT="${PHANTOM_STARTING_POINT_CONTRACT:-$ROOT/docs/production/PHANTOM_PROJECT_STARTING_POINT.json}"
STATE_DIR="${PHANTOM_STATE_DIR:-$ROOT/.phantom-state}"
mkdir -p "$STATE_DIR"

[[ -f "$CONTRACT" ]] || { echo "PHANTOM_LIFECYCLE_REJECT: starting-point contract missing" >&2; exit 1; }
python3 - "$CONTRACT" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c["canonical_authority"]=="Phantom"
assert c["production_authority"]=="Phantom-owned physical substrate"
assert c["third_party_production_authority"] is False
assert "NO_THIRD_PARTY_PRODUCTION_AUTHORITY" in c["hard_boundaries"]
assert "NO_EVIDENCE_NO_CLAIM" in c["hard_boundaries"]
PY

cat > "$STATE_DIR/first-party-lifecycle.json" <<JSON
{
  "owner_attribution": "Donald Long III / Phantom",
  "canonical_authority": "Phantom",
  "production_authority": "Phantom-owned physical substrate",
  "third_party_production_authority": false,
  "lifecycle": ["ENDORSE","CONFIGURE","WRITE","WIRE","EXECUTE","VERIFY"],
  "truth_policy": "NO_EVIDENCE_NO_CLAIM",
  "physical_execution_proven": false,
  "public_live_proven": false
}
JSON
echo "PHANTOM_FIRST_PARTY_LIFECYCLE_READY"
