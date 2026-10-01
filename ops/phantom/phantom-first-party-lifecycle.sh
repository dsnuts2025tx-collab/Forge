#!/usr/bin/env bash
set -Eeuo pipefail

# Phantom First-Party Lifecycle — canonical ENDORSE -> CONFIGURE -> WRITE -> WIRE -> EXECUTE.
# Owner: Donald Long III / Phantom.
# Third-party production authority is forbidden.
# This script records evidence and fails closed; it never treats an attempted action as proof.

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE_DIR="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
CONTRACT="${PHANTOM_STARTING_POINT_CONTRACT:-$ROOT/docs/production/PHANTOM_PROJECT_STARTING_POINT.json}"
PRODUCTION_AUTHORITY="${PHANTOM_PRODUCTION_AUTHORITY:-Phantom-owned physical substrate}"
EXTERNAL_AUTHORITY="${PHANTOM_EXTERNAL_PROVIDER_AUTHORITY:-false}"

mkdir -p "$STATE_DIR"

reject() {
  printf 'PHANTOM_LIFECYCLE_REJECT: %s\n' "$*" >&2
  exit 1
}
receipt() {
  local stage="$1" status="$2" reason="$3"
  python3 - "$STATE_DIR/lifecycle-receipt.json" "$stage" "$status" "$reason" <<'PY'
import json,sys,datetime,hashlib,os
path,stage,status,reason=sys.argv[1:]
r={
 "schema":"phantom.first-party.lifecycle.v1",
 "owner_attribution":"Donald Long III / Phantom",
 "canonical_authority":"Phantom",
 "production_authority":"Phantom-owned physical substrate",
 "third_party_production_authority":False,
 "stage":stage,"status":status,"reason":reason,
 "timestamp_utc":datetime.datetime.now(datetime.timezone.utc).isoformat()
}
r["digest_sha256"]=hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest()
json.dump(r,open(path,"w",encoding="utf-8"),indent=2)
open(path,"a",encoding="utf-8").write("\n")
PY
  printf 'PHANTOM_LIFECYCLE_%s=%s\n' "$stage" "$status"
}

[[ -f "$CONTRACT" ]] || reject "starting-point contract missing"
[[ "$PRODUCTION_AUTHORITY" == "Phantom-owned physical substrate" ]] || reject "production authority is not Phantom-owned"
[[ "$EXTERNAL_AUTHORITY" == "false" ]] || reject "third-party production authority is enabled"

python3 - "$CONTRACT" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c["canonical_authority"]=="Phantom"
assert c["production_authority"]=="Phantom-owned physical substrate"
assert c["third_party_production_authority"] is False
for x in ("NO_THIRD_PARTY_PRODUCTION_AUTHORITY","NO_EVIDENCE_NO_CLAIM"):
    assert x in c["hard_boundaries"]
PY

receipt "ENDORSE" "PASS" "Phantom authority and ownership contract validated"
receipt "CONFIGURE" "PASS" "Sovereign production and provider policy validated"
receipt "WRITE" "READY" "First-party write lane authorized; physical write requires controlled substrate"
receipt "WIRE" "READY" "First-party wire lane authorized; physical channel remains evidence-gated"
receipt "EXECUTE" "READY" "Execution lane authorized; no third-party production authority permitted"
receipt "VERIFY" "REQUIRED" "Independent evidence is required before PUBLIC_LIVE_PROVEN"

cat > "$STATE_DIR/first-party-lifecycle.json" <<JSON
{
  "authority": "Phantom",
  "owner_attribution": "Donald Long III / Phantom",
  "production_authority": "Phantom-owned physical substrate",
  "third_party_production_authority": false,
  "lifecycle": ["ENDORSE","CONFIGURE","WRITE","WIRE","EXECUTE","VERIFY"],
  "truth_policy": "NO_EVIDENCE_NO_CLAIM",
  "public_live_proven": false
}
JSON

printf '%s\n' "PHANTOM_FIRST_PARTY_LIFECYCLE_READY"
