#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="${PHANTOM_STATE_DIR:-$ROOT/.phantom/state/ip-sentinel}"
mkdir -p "$STATE/observations" "$STATE/incidents"
if [ "$#" -lt 2 ]; then echo "usage: $0 <source> <observation-file>"; exit 64; fi
SOURCE="$1"; FILE="$2"; test -f "$FILE" || { echo "OBSERVATION=BLOCKED:file_missing"; exit 1; }
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SHA="$(sha256sum "$FILE" | awk '{print $1}')"
ID="IPOBS-$NOW-$SHA"
cp "$FILE" "$STATE/observations/$ID.evidence"
printf '{"schema":"phantom.ip-observation.v1","incident_id":"%s","observed_at":"%s","source":"%s","evidence_sha256":"%s","classification":"OBSERVED","requires_comparison":true,"no_theft_claim":true}\n' "$ID" "$NOW" "$SOURCE" "$SHA" > "$STATE/observations/$ID.json"
echo "OBSERVATION_RECORDED=$ID"
