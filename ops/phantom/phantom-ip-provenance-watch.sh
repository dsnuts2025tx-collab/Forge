#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="${PHANTOM_STATE_DIR:-$ROOT/.phantom/state/ip-watch}"
MANIFEST="$ROOT/docs/governance/PHANTOM_IP_PROVENANCE_WATCH.json"
mkdir -p "$STATE"
test -f "$MANIFEST" || { echo "IP_WATCH=BLOCKED:manifest_missing"; exit 1; }
command -v sha256sum >/dev/null 2>&1 || { echo "IP_WATCH=BLOCKED:sha256sum_missing"; exit 1; }
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BASE="$STATE/artifact-fingerprints.tsv"; TMP="$STATE/artifact-fingerprints.current.tsv"
: > "$TMP"
find "$ROOT" -type f ! -path "$ROOT/.git/*" ! -path "$ROOT/.phantom/state/*" \( -path "$ROOT/docs/*" -o -path "$ROOT/ops/*" -o -path "$ROOT/apps/*" -o -path "$ROOT/src/*" -o -path "$ROOT/lib/*" -o -path "$ROOT/packages/*" -o -name 'PHANTOM_COPYRIGHT.md' \) -print0 | sort -z | while IFS= read -r -d '' f; do rel="${f#$ROOT/}"; sha="$(sha256sum "$f" | awk '{print $1}')"; printf '%s\t%s\n' "$sha" "$rel" >> "$TMP"; done
if [ ! -f "$BASE" ]; then
  cp "$TMP" "$BASE"
  printf '{"schema":"phantom.ip-watch-receipt.v1","observed_at":"%s","classification":"NO_EVIDENCE","baseline_created":true,"changed_artifacts":[],"owner":"Donald Long III / Phantom"}\n' "$NOW" > "$STATE/latest-receipt.json"
  echo "IP_WATCH=BASELINE_CREATED"; exit 0
fi
CHANGES="$STATE/changes.tsv"; comm -3 <(sort "$BASE") <(sort "$TMP") > "$CHANGES" || true
if [ -s "$CHANGES" ]; then
  cp "$TMP" "$STATE/artifact-fingerprints.changed.tsv"
  printf '{"schema":"phantom.ip-watch-receipt.v1","observed_at":"%s","classification":"POSSIBLE_OVERLAP","baseline_created":false,"changed_artifacts_file":"%s","requires_review":true,"owner":"Donald Long III / Phantom"}\n' "$NOW" "$CHANGES" > "$STATE/latest-receipt.json"
  echo "IP_WATCH=REVIEW_REQUIRED"; exit 2
fi
printf '{"schema":"phantom.ip-watch-receipt.v1","observed_at":"%s","classification":"NO_EVIDENCE","baseline_created":false,"changed_artifacts":[],"owner":"Donald Long III / Phantom"}\n' "$NOW" > "$STATE/latest-receipt.json"
echo "IP_WATCH=CLEAN"
