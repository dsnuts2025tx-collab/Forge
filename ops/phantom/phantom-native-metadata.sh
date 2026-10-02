#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
CONTRACT="${PHANTOM_NATIVE_METADATA_CONTRACT:-$ROOT/docs/production/PHANTOM_NATIVE_METADATA_CONTRACT.json}"
mkdir -p "$STATE/metadata"
reject(){ echo "PHANTOM_METADATA_REJECT: $*" >&2; exit 1; }
[[ -f "$CONTRACT" ]] || reject "native metadata contract missing"
python3 - "$CONTRACT" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c["canonical_authority"]=="Phantom"
assert c["production_authority"]=="Phantom-owned physical substrate"
assert c["third_party_production_authority"] is False
assert "PHANTOM_METADATA_IS_AUTHORITATIVE" in c["principles"]
assert c["execution_policy"]["executable_bit_required"] is False
assert c["execution_policy"]["filesystem_mode_authoritative"] is False
assert c["execution_policy"]["source_control_mode_authoritative"] is False
PY
python3 - "$ROOT" "$STATE/metadata/system-metadata.json" "$CONTRACT" <<'PY'
import json,sys,hashlib,datetime,os
root,out,contract=sys.argv[1:]
def digest(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for b in iter(lambda:f.read(1048576),b): h.update(b)
 return h.hexdigest()
records=[]
for rel in ["docs/production/PHANTOM_PROJECT_STARTING_POINT.json","docs/production/PHANTOM_EXECUTION_STARTING_POINT.json","docs/production/PHANTOM_NATIVE_METADATA_CONTRACT.json"]:
 p=os.path.join(root,rel)
 if os.path.isfile(p): records.append({"artifact_id":rel,"artifact_kind":"canonical-contract","content_digest_sha256":digest(p),"lifecycle_state":"VERIFIED","execution_policy":"phantom-native-shell-boundary"})
x={"schema":"phantom.system-metadata.v1","owner_attribution":"Donald Long III / Phantom","canonical_authority":"Phantom","production_authority":"Phantom-owned physical substrate","third_party_production_authority":False,"file_mode_authority":False,"source_control_metadata_authority":False,"ambient_provider_metadata_authority":False,"native_execution_boundary":"Phantom Native Shell Boundary","records":records,"updated_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat()}
x["system_digest_sha256"]=hashlib.sha256(json.dumps(x,sort_keys=True).encode()).hexdigest()
json.dump(x,open(out,"w"),indent=2);open(out,"a").write("\n")
PY
echo "PHANTOM_NATIVE_METADATA=PASS"
