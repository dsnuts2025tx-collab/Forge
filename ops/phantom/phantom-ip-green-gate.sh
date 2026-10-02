#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
mkdir -p "$STATE"

fail=0
pass(){ echo "IP_GREEN_PASS: $*"; }
bad(){ echo "IP_GREEN_FAIL: $*" >&2; fail=1; }

[[ -s "$ROOT/PHANTOM_COPYRIGHT.md" ]] && pass "copyright/provenance notice installed" || bad "copyright notice missing"
[[ -s "$ROOT/docs/governance/PHANTOM_IP_PROVENANCE_POLICY.json" ]] && pass "IP provenance policy installed" || bad "IP provenance policy missing"

if [[ -f "$ROOT/docs/governance/PHANTOM_IP_PROVENANCE_POLICY.json" ]] && command -v jq >/dev/null 2>&1; then
  jq -e '.owner_attribution == "Donald Long III / Phantom" and .rules | length >= 5'     "$ROOT/docs/governance/PHANTOM_IP_PROVENANCE_POLICY.json" >/dev/null &&
    pass "IP provenance policy structurally valid" ||
    bad "IP provenance policy invalid"
fi

cat > "$STATE/ip-green-state.json" <<JSON
{
  "system":"Phantom IP Governance",
  "copyright_notice_installed":$([[ -s "$ROOT/PHANTOM_COPYRIGHT.md" ]] && echo true || echo false),
  "provenance_policy_installed":$([[ -s "$ROOT/docs/governance/PHANTOM_IP_PROVENANCE_POLICY.json" ]] && echo true || echo false),
  "third_party_production_authority":false,
  "infringement_status":"NOT_ADJUDICATED",
  "truth_policy":"copyright attribution and provenance are distinct from a proven infringement finding",
  "updated_at_utc":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

(( fail == 0 )) || exit 30
pass "IP governance GREEN"
