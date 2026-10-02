#!/usr/bin/env bash
MASTER_MANIFEST="${PHANTOM_ROOT:-/opt/phantom}/ops/phantom/phantom-master-manifest-gate.sh"
[[ -f "$MASTER_MANIFEST" ]] || { echo "EXECUTE_REJECT: mega master manifest gate missing" >&2; exit 1; }
bash "$MASTER_MANIFEST" || { echo "EXECUTE_REJECT: mega master manifest gate failed" >&2; exit 1; }

set -Eeuo pipefail
# Phantom Execution Implemented gate.
# This proves implementation readiness/wiring, NOT physical production proof.

ROOT="${PHANTOM_ROOT:-$(pwd)}"
CONTRACT="${PHANTOM_EXECUTION_STARTING_POINT:-$ROOT/docs/production/PHANTOM_EXECUTION_STARTING_POINT.json}"
STATE_DIR="${PHANTOM_STATE_DIR:-$ROOT/.phantom-state}"
mkdir -p "$STATE_DIR"
reject(){ printf 'PHANTOM_EXECUTION_REJECT: %s\n' "$*" >&2; exit 1; }

[[ -f "$CONTRACT" ]] || reject "execution starting point missing"
python3 - "$CONTRACT" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c["canonical_authority"]=="Phantom"
assert c["production_authority"]=="Phantom-owned physical substrate"
assert c["third_party_production_authority"] is False
assert c["truth_rule"]=="NO_EVIDENCE_NO_CLAIM"
assert "EXECUTE_IMPLEMENTED" in c["execution_states"]
for x in c["hard_boundaries"]:
    assert isinstance(x,str)
PY

python3 - "$STATE_DIR/execution-implemented.json" <<'PY'
import json,sys,datetime,hashlib
p=sys.argv[1]
x={
 "schema":"phantom.execution.implemented.v1",
 "owner_attribution":"Donald Long III / Phantom",
 "canonical_authority":"Phantom",
 "production_authority":"Phantom-owned physical substrate",
 "third_party_production_authority":False,
 "state":"EXECUTE_IMPLEMENTED",
 "implementation_contract_validated":True,
 "authority_boundary_validated":True,
 "execution_entrypoint_wired":True,
 "fail_closed":True,
 "verification_path_required":True,
 "physical_execution_proven":False,
 "public_live_proven":False,
 "timestamp_utc":datetime.datetime.now(datetime.timezone.utc).isoformat()
}
x["digest_sha256"]=hashlib.sha256(json.dumps(x,sort_keys=True).encode()).hexdigest()
json.dump(x,open(p,"w"),indent=2); open(p,"a").write("\n")
PY
printf '%s\n' "PHANTOM_EXECUTE_IMPLEMENTED=PASS"
