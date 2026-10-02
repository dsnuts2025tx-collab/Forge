#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
MANIFEST="${PHANTOM_MASTER_MANIFEST:-$ROOT/docs/production/PHANTOM_MASTER_MANIFEST.json}"
mkdir -p "$STATE"
reject(){ echo "MASTER_MANIFEST_REJECT: $*" >&2; exit 1; }
[[ -f "$MANIFEST" ]] || reject "mega master manifest missing"
python3 - "$MANIFEST" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c["canonical_authority"]=="Phantom"
assert c["production_authority"]=="Phantom-owned physical substrate"
assert c["third_party_production_authority"] is False
assert c["truth_policy"]=="NO_EVIDENCE_NO_CLAIM"
assert c["native_metadata"]["executable_bit_required"] is False
assert c["native_metadata"]["file_mode_is_authority"] is False
assert c["native_metadata"]["source_control_mode_is_authority"] is False
assert c["execution"]["fail_closed"] is True
assert c["deployment"]["public_live_gate"]=="INDEPENDENT_EXTERNAL_VERIFY"
assert c["promotion"]["no_state_skipping"] is True
required=["CREATE","BIND","ENDORSE","CONFIGURE","WRITE","WIRE","EXECUTE","VERIFY","DEPLOY","PUBLIC_DEPLOYMENT_ACTIVE","INDEPENDENT_EXTERNAL_VERIFY","PUBLIC_LIVE_PROVEN","FOOTPRINT","CONTINUOUS_OPERATION"]
assert c["lifecycle"]["mandatory_order"]==required
PY
python3 - "$MANIFEST" "$STATE/master-manifest-state.json" <<'PY'
import json,sys,hashlib,datetime
m=sys.argv[1]; out=sys.argv[2]
raw=open(m,"rb").read()
x={"schema":"phantom.master-manifest.state.v1","manifest_id":"PHANTOM-MASTER-2026-10-01","manifest_sha256":hashlib.sha256(raw).hexdigest(),"authority":"Phantom","state":"MASTER_MANIFEST_VERIFIED","third_party_production_authority":False,"updated_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat()}
x["state_digest_sha256"]=hashlib.sha256(json.dumps(x,sort_keys=True).encode()).hexdigest()
json.dump(x,open(out,"w"),indent=2);open(out,"a").write("\n")
PY
echo "PHANTOM_MASTER_MANIFEST=PASS"
