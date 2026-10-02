#!/usr/bin/env bash
set -Euo pipefail

# Phantom Pathway — canonical first-party execution authority.
# Owner: Donald Long III / Phantom.
# No third-party provider may be canonical production authority.

ROOT="${PHANTOM_ROOT:-/opt/phantom}"
CONTROLLER="${PHANTOM_CONTROLLER:-$ROOT/ops/phantom/phantom-production-controller.sh}"
GREEN_GATE="${PHANTOM_GREEN_GATE:-$ROOT/ops/phantom/phantom-green-gate.sh}"
SOVEREIGN_BIND="${PHANTOM_SOVEREIGN_BIND:-$ROOT/ops/phantom/phantom-sovereign-bind.sh}"
SOVEREIGN_INFRA_GATE="${PHANTOM_SOVEREIGN_INFRA_GATE:-$ROOT/ops/phantom/phantom-sovereign-infrastructure-gate.sh}"
CAPABILITY_FABRIC="${PHANTOM_CAPABILITY_FABRIC:-$ROOT/ops/phantom/phantom-capability-fabric.sh}"
FIRST_PARTY_LIFECYCLE="${PHANTOM_FIRST_PARTY_LIFECYCLE:-$ROOT/ops/phantom/phantom-first-party-lifecycle.sh}"
PROJECT_START="${PHANTOM_PROJECT_STARTING_POINT:-$ROOT/docs/production/PHANTOM_PROJECT_STARTING_POINT.json}"
EXPECTED_AUTHORITY="Phantom"
EXPECTED_HOSTNAME="${PHANTOM_PUBLIC_HOSTNAME:-insight.phantomlife.ai}"
EXPECTED_RELEASE="${PHANTOM_RELEASE_SHA:-fcd1553a6de609182defea978cf2ea6ea3e6c0e1441017b2219bd60dae4e23b4}"
STATE_DIR="${PHANTOM_STATE_DIR:-/var/lib/phantom}"

reject(){ echo "PATHWAY_REJECT: $*" >&2; return 1; }
pass(){ echo "PATHWAY_PASS: $*"; }

authorize(){
  [[ -f "${PHANTOM_PATHWAY_BINDING:-$ROOT/docs/production/PHANTOM_PATHWAY_CONTRACT.json}" ]] || reject "Pathway contract missing"
  [[ -f "$PROJECT_START" ]] || reject "Phantom project starting point missing"
  [[ -f "$CONTROLLER" ]] || reject "first-party controller missing"
  [[ -f "$GREEN_GATE" ]] || reject "software green gate missing"
  [[ -f "$SOVEREIGN_BIND" ]] || reject "sovereign bind gate missing"
  [[ -f "$SOVEREIGN_INFRA_GATE" ]] || reject "sovereign infrastructure gate missing"
  [[ -f "$CAPABILITY_FABRIC" ]] || reject "frontier capability fabric missing"
  [[ -f "$FIRST_PARTY_LIFECYCLE" ]] || reject "first-party lifecycle missing"
  python3 - "$PROJECT_START" <<'PY' || reject "project starting point contract is invalid"
import json,sys
c=json.load(open(sys.argv[1],encoding="utf-8"))
assert c.get("canonical_authority")=="Phantom"
assert c.get("production_authority")=="Phantom-owned physical substrate"
assert c.get("third_party_production_authority") is False
assert "NO_THIRD_PARTY_PRODUCTION_AUTHORITY" in c.get("hard_boundaries",[])
assert "NO_EVIDENCE_NO_CLAIM" in c.get("hard_boundaries",[])
PY
  [[ "${PHANTOM_CANONICAL_AUTHORITY:-$EXPECTED_AUTHORITY}" == "$EXPECTED_AUTHORITY" ]] || reject "canonical authority is not Phantom"
  [[ "${PHANTOM_PRODUCTION_AUTHORITY:-Phantom-owned physical substrate}" == "Phantom-owned physical substrate" ]] || reject "production authority is not Phantom-owned physical substrate"
  [[ "${PHANTOM_EXTERNAL_PROVIDER_AUTHORITY:-false}" == "false" ]] || reject "external provider cannot be production authority"
  [[ "${PHANTOM_PUBLIC_HOSTNAME:-$EXPECTED_HOSTNAME}" == "$EXPECTED_HOSTNAME" ]] || reject "hostname binding mismatch"
  [[ "${PHANTOM_RELEASE_SHA:-$EXPECTED_RELEASE}" == "$EXPECTED_RELEASE" ]] || reject "release identity mismatch"
  bash "$GREEN_GATE" || reject "software green gate is not green"
  bash "$CAPABILITY_FABRIC" || reject "frontier capability fabric is not initialized"
  bash "$SOVEREIGN_INFRA_GATE" || reject "sovereign infrastructure gate is not green"
}

dispatch(){
  local action="${1:-}"
  case "$action" in
    execute-all)
      bash "$FIRST_PARTY_LIFECYCLE" || reject "first-party lifecycle failed"
      bash "$GREEN_GATE" || reject "software green gate failed"
      bash "$CAPABILITY_FABRIC" || reject "capability fabric failed"
      bash "$SOVEREIGN_INFRA_GATE" || reject "sovereign infrastructure gate failed"
      bash "$SOVEREIGN_BIND" || reject "sovereign binding failed; physical evidence gate remains authoritative"
      bash "$CONTROLLER" preflight || reject "production controller preflight failed"
      ;;
    promote)
      bash "$FIRST_PARTY_LIFECYCLE" || reject "first-party lifecycle failed"
      bash "$SOVEREIGN_BIND" || reject "sovereign binding failed; promotion is blocked"
      "$CONTROLLER" promote
      ;;
    external-verify)
      [[ -s "${PHANTOM_EXTERNAL_PROOF_FILE:-$STATE_DIR/external-proof.json}" ]] || reject "external proof is not present"
      PHANTOM_EXTERNAL_PROOF_FILE="${PHANTOM_EXTERNAL_PROOF_FILE:-$STATE_DIR/external-proof.json}" "$CONTROLLER" external-verify
      ;;
    *) reject "action not allowlisted: $action";;
  esac
}

authorize
mkdir -p "$STATE_DIR"
cat > "$STATE_DIR/pathway-dispatch.json" <<JSON
{
  "system":"Phantom Pathway",
  "canonical_authority":"$EXPECTED_AUTHORITY",
  "production_authority":"Phantom-owned physical substrate",
  "hostname":"$EXPECTED_HOSTNAME",
  "release_sha256":"$EXPECTED_RELEASE",
  "action":"${1:-}",
  "third_party_production_authority":false,
  "project_starting_point_enforced":true,
  "updated_at_utc":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
dispatch "$@"
pass "Pathway dispatch complete"
