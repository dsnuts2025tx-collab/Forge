#!/usr/bin/env bash
set -Eeuo pipefail

# Phantom Green Gate — single authoritative software gate.
# Green means the software/control-plane contract is internally consistent.
# It deliberately does not claim public production live.

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
STATE="${PHANTOM_STATE_DIR:-/var/lib/phantom}"
mkdir -p "$STATE"
errors=0

ok(){ printf 'GREEN_GATE_PASS: %s\n' "$*"; }
bad(){ printf 'GREEN_GATE_FAIL: %s\n' "$*" >&2; errors=$((errors+1)); }

for f in   "$ROOT/ops/phantom/phantom-pathway.sh"   "$ROOT/ops/phantom/phantom-production-controller.sh"   "$ROOT/ops/phantom/phantom-convergence-loop.sh"   "$ROOT/ops/phantom/phantom-capability-fabric.sh"; do
  [[ -x "$f" ]] && ok "executable: $f" || bad "missing/non-executable: $f"
done

if [[ -f "$ROOT/docs/production/PHANTOM_PATHWAY_CONTRACT.json" ]]; then
  command -v jq >/dev/null 2>&1 && jq -e . "$ROOT/docs/production/PHANTOM_PATHWAY_CONTRACT.json" >/dev/null 2>&1 &&
    ok "Pathway contract valid" || bad "Pathway contract invalid or jq unavailable"
else
  bad "Pathway contract missing"
fi

if [[ -f "$ROOT/docs/production/PHANTOM_FRONTIER_CAPABILITY_FABRIC.json" ]]; then
  command -v jq >/dev/null 2>&1 && jq -e '.canonical_authority=="Phantom" and (.hard_boundaries | index("NO_THIRD_PARTY_PRODUCTION_AUTHORITY")) and (.hard_boundaries | index("NO_EVIDENCE_NO_CLAIM"))' "$ROOT/docs/production/PHANTOM_FRONTIER_CAPABILITY_FABRIC.json" >/dev/null 2>&1 &&
    ok "Frontier capability fabric contract valid" || bad "Frontier capability fabric contract invalid"
else
  bad "Frontier capability fabric contract missing"
fi

[[ "${PHANTOM_FRONTIER_CAPABILITY_ENABLED:-true}" == true ]] &&
  ok "frontier capability fabric enabled" || bad "frontier capability fabric disabled"

[[ "${PHANTOM_CANONICAL_AUTHORITY:-Phantom}" == Phantom ]] &&
  ok "canonical authority is Phantom" || bad "canonical authority mismatch"
[[ "${PHANTOM_EXTERNAL_PROVIDER_AUTHORITY:-false}" == false ]] &&
  ok "third-party production authority disabled" || bad "third-party production authority enabled"

cat > "$STATE/green-gate.json" <<JSON
{
  "system":"Phantom Green Gate",
  "software_control_plane":"$([[ $errors -eq 0 ]] && echo GREEN || echo RED)",
  "public_live":"NOT_ASSERTED",
  "external_provider_as_production_authority":false,
  "truth_policy":"PUBLIC_LIVE requires physical deployment and independent external proof",
  "updated_at_utc":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

(( errors == 0 )) || exit 20
ok "software/control-plane gate GREEN"
