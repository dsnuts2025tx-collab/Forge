#!/usr/bin/env bash
set -Eeuo pipefail

# Phantom Project Starting Point — first-party project initializer.
# Owner: Donald Long III / Phantom.
# Purpose: make the sovereign/no-third-party contract the default starting point for every project.

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
SOURCE="${PHANTOM_STARTING_POINT_CONTRACT:-$ROOT/docs/production/PHANTOM_PROJECT_STARTING_POINT.json}"
TARGET_ROOT="${1:-}"
[[ -n "$TARGET_ROOT" ]] || { echo "PROJECT_INIT_REJECT: project root required" >&2; exit 1; }
[[ -d "$TARGET_ROOT" ]] || { echo "PROJECT_INIT_REJECT: project root does not exist" >&2; exit 1; }
[[ -f "$SOURCE" ]] || { echo "PROJECT_INIT_REJECT: canonical starting-point contract missing" >&2; exit 1; }

mkdir -p "$TARGET_ROOT/.phantom"
cp "$SOURCE" "$TARGET_ROOT/.phantom/PROJECT_CONTRACT.json"

python3 - "$TARGET_ROOT/.phantom/PROJECT_CONTRACT.json" "$TARGET_ROOT/.phantom/PROJECT_IDENTITY.json" <<'PY'
import json,sys,datetime,hashlib,os
contract_path, identity_path = sys.argv[1:]
contract=json.load(open(contract_path,encoding="utf-8"))
if contract.get("canonical_authority") != "Phantom":
    raise SystemExit("PROJECT_INIT_REJECT: canonical authority is not Phantom")
if contract.get("third_party_production_authority") is not False:
    raise SystemExit("PROJECT_INIT_REJECT: third-party production authority is enabled")
project_root=os.path.dirname(os.path.dirname(os.path.abspath(contract_path)))
name=os.path.basename(project_root)
identity={
  "project_name": name,
  "owner_attribution": "Donald Long III / Phantom",
  "canonical_authority": "Phantom",
  "production_authority": "Phantom-owned physical substrate",
  "third_party_production_authority": False,
  "created_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "contract_sha256": hashlib.sha256(open(contract_path,"rb").read()).hexdigest(),
  "status": "INITIALIZED",
  "truth_policy": "NO_EVIDENCE_NO_CLAIM"
}
json.dump(identity,open(identity_path,"w",encoding="utf-8"),indent=2)
open(identity_path,"a",encoding="utf-8").write("\n")
PY

echo "PHANTOM_PROJECT_STARTING_POINT_INITIALIZED: $TARGET_ROOT"
