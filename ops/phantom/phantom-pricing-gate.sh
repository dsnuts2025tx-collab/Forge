#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="${PHANTOM_ROOT:-$(pwd)}"
C="$ROOT/docs/production/PHANTOM_PRICING_CONSTITUTION.json"
R="$ROOT/docs/production/PHANTOM_PROJECT_PRICING_REGISTRY.json"
[[ -s "$C" && -s "$R" ]] || { echo "PHANTOM_PRICING_REJECT: missing pricing authority"; exit 1; }
python3 - "$C" "$R" <<'PY'
import json,sys
c,r=[json.load(open(x,encoding="utf-8")) for x in sys.argv[1:]]
assert c["canonical_authority"]=="Phantom"
assert c["third_party_production_authority"] is False
assert c["currency"]=="USD"
assert c["universal_tiers"][0]["monthly"]==0
assert c["universal_tiers"][1]["monthly"]==9.99
assert c["universal_tiers"][2]["monthly"]==24.99
assert c["universal_tiers"][3]["monthly"]==99.99
assert c["usage_policy"]["no_silent_overage"] is True
assert r["all_projects_inherit"] is True
assert len(r["projects"]) >= 36
print("PHANTOM_PRICING_GATE=PASS")
print("PHANTOM_PRICED_PROJECTS="+str(len(r["projects"])))
PY
