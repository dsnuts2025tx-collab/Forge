#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="${PHANTOM_STATE_DIR:-$ROOT/.phantom/state/ip-sentinel}"
MANIFEST="$ROOT/docs/governance/PHANTOM_NATIVE_IP_SENTINEL.json"
mkdir -p "$STATE/observations" "$STATE/incidents" "$STATE/receipts"
command -v sha256sum >/dev/null || { echo "SENTINEL=BLOCKED:sha256sum_missing"; exit 1; }
test -s "$MANIFEST" || { echo "SENTINEL=BLOCKED:manifest_missing"; exit 1; }
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BASE="$STATE/baseline.tsv"; CUR="$STATE/current.tsv"
: > "$CUR"
find "$ROOT" -type f ! -path "$ROOT/.git/*" ! -path "$ROOT/.phantom/state/*" -print0 |
while IFS= read -r -d '' f; do
  rel="${f#$ROOT/}"
  sha="$(sha256sum "$f" | awk '{print $1}')"
  printf '%s\t%s\n' "$sha" "$rel" >> "$CUR"
done
sort -o "$CUR" "$CUR"
if [ ! -f "$BASE" ]; then
  cp "$CUR" "$BASE"
  printf '%s\tBASELINED\t%s\n' "$NOW" "$BASE" > "$STATE/receipts/$NOW.receipt.tsv"
  echo "SENTINEL=BASELINED"
  exit 0
fi
CHANGES="$STATE/changes.tsv"
comm -3 "$BASE" "$CUR" > "$CHANGES" || true
if [ -s "$CHANGES" ]; then
  cp "$CHANGES" "$STATE/incidents/$NOW.possible-overlap.tsv"
  printf '%s\tPOSSIBLE_OVERLAP\t%s\n' "$NOW" "$STATE/incidents/$NOW.possible-overlap.tsv" > "$STATE/receipts/$NOW.receipt.tsv"
  echo "SENTINEL=POSSIBLE_OVERLAP"
  exit 2
fi
printf '%s\tCLEAN\n' "$NOW" > "$STATE/receipts/$NOW.receipt.tsv"
echo "SENTINEL=CLEAN"
