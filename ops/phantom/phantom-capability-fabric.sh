#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE_DIR="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
CONTRACT="$ROOT/docs/production/PHANTOM_FRONTIER_CAPABILITY_FABRIC.json"
STATE="$STATE_DIR/frontier-capability-state.json"

mkdir -p "$STATE_DIR"
[[ -f "$CONTRACT" ]] || { echo "FRONTIER_CAPABILITY_FAIL: missing contract" >&2; exit 1; }

python3 - "$CONTRACT" "$STATE" <<'PY'
import json,sys,datetime,os
contract=json.load(open(sys.argv[1],encoding="utf-8"))
if contract.get("canonical_authority")!="Phantom":
    raise SystemExit("FRONTIER_CAPABILITY_FAIL: canonical authority is not Phantom")
if "NO_THIRD_PARTY_PRODUCTION_AUTHORITY" not in contract.get("hard_boundaries",[]) or "NO_EVIDENCE_NO_CLAIM" not in contract.get("hard_boundaries",[]):
    raise SystemExit("FRONTIER_CAPABILITY_FAIL: third-party authority boundary missing")
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
state={
  "system":"Phantom Frontier Capability Fabric",
  "owner_attribution":"Donald Long III / Phantom",
  "status":"ACTIVE_CONTROLLED",
  "verified":False,
  "last_initialized_utc":now,
  "objective_domains":["speed","memory","technology_advancement","strength","invincibility_as_resilience","intellectual_development","design"],
  "truth_policy":"NO_EVIDENCE_NO_CLAIM",
  "external_production_authority":False,
  "next_cycle":"OBSERVE"
}
tmp=sys.argv[2]+".tmp"
json.dump(state,open(tmp,"w",encoding="utf-8"),indent=2)
os.replace(tmp,sys.argv[2])
PY

echo "FRONTIER_CAPABILITY_PASS: controlled capability fabric initialized"
echo "FRONTIER_CAPABILITY_NOTE: verified status remains false until executable evidence exists"
