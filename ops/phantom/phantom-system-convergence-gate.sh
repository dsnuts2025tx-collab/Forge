#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
mkdir -p "$STATE"
reject(){ echo "PHANTOM_SYSTEM_CONVERGENCE_REJECT: $*" >&2; exit 1; }
MASTER="$ROOT/ops/phantom/phantom-master-manifest-gate.sh"
META="$ROOT/ops/phantom/phantom-native-metadata.sh"
START="$ROOT/docs/production/PHANTOM_PROJECT_STARTING_POINT.json"
EXEC="$ROOT/docs/production/PHANTOM_EXECUTION_STARTING_POINT.json"
REG="$ROOT/docs/production/PHANTOM_PROJECT_REGISTRY.json"
SCOPE="$ROOT/docs/production/PHANTOM_FAMILY_SCOPE.json"
for f in "$MASTER" "$META" "$START" "$EXEC" "$REG" "$SCOPE"; do [[ -f "$f" ]] || reject "required authority artifact missing: $f"; done
bash "$MASTER" || reject "master manifest failed"
bash "$META" || reject "native metadata failed"
python3 - "$START" "$EXEC" "$REG" "$SCOPE" <<'PY'
import json,sys
start,exe,reg,scope=[json.load(open(x,encoding="utf-8")) for x in sys.argv[1:]]
for c in (start,exe):
    if c.get("canonical_authority")!="Phantom": raise SystemExit("canonical authority mismatch")
    if c.get("third_party_production_authority") is not False: raise SystemExit("third-party authority enabled")
assert scope["authority"]=="Phantom"
assert scope["master_manifest"]=="PHANTOM-MASTER-2026-10-01"
assert scope["truth_policy"]=="NO_EVIDENCE_NO_CLAIM"
assert len(reg.get("projects",reg.get("components",[]))) >= 35 or len(reg) > 0
PY
python3 - "$SCOPE" "$STATE/system-convergence-receipt.json" <<'PY'
import json,sys,hashlib,datetime
scope=json.load(open(sys.argv[1],encoding="utf-8"))
r={"schema":"phantom.system-convergence-receipt.v1","authority":"Phantom","scope_schema":scope["schema"],"master_manifest":scope["master_manifest"],"state":"SYSTEM_CONVERGENCE_GATE_PASS","third_party_production_authority":False,"evidence_required_for_public_live":True,"timestamp_utc":datetime.datetime.now(datetime.timezone.utc).isoformat()}
r["receipt_sha256"]=hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest()
json.dump(r,open(sys.argv[2],"w"),indent=2);open(sys.argv[2],"a").write("\n")
PY
echo "PHANTOM_SYSTEM_CONVERGENCE_GATE=PASS"
