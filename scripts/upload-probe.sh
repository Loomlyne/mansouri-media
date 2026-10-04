#!/usr/bin/env bash
# Usage: bash scripts/upload-probe.sh <local|preview|production>
# Uploads the generated probe film, poster and env marker. Production needs SHIP_APPROVED=1 (control session, after Koss's Ship).
set -euo pipefail
cd "$(dirname "$0")/.."

ENVNAME=${1:-}
case "$ENVNAME" in
  local) BUCKET=mansourimedia-media; MODE=--local ;;
  preview) BUCKET=mansourimedia-media-preview; MODE=--remote ;;
  production)
    if [ "${SHIP_APPROVED:-}" != "1" ]; then
      echo "refused: production upload belongs to the Ship (plan 01-06); SHIP_APPROVED=1 is not set" >&2
      exit 1
    fi
    BUCKET=mansourimedia-media; MODE=--remote ;;
  *) echo "usage: $0 <local|preview|production>" >&2; exit 2 ;;
esac

for f in .probe/test-9x16.mp4 .probe/poster.webp ".probe/env-$ENVNAME.txt"; do
  [ -f "$f" ] || { echo "missing $f; run scripts/make-probe-media.sh first" >&2; exit 1; }
done

IMM="public, max-age=31536000, immutable"
put() { bash scripts/wr.sh r2 object put "$BUCKET/$1" --file "$2" --content-type "$3" --cache-control "$4" "$MODE" -y; }
put _probe/test-9x16.mp4 .probe/test-9x16.mp4 video/mp4 "$IMM"
put _probe/poster.webp .probe/poster.webp image/webp "$IMM"
put _probe/env.txt ".probe/env-$ENVNAME.txt" text/plain "no-store"
echo "uploaded probe to $ENVNAME ($BUCKET $MODE)"
