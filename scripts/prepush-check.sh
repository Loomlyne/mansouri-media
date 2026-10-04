#!/usr/bin/env bash
# Public-repo leak gate. Run before any push. Exits 1 on any hit.
set -uo pipefail
cd "$(dirname "$0")/.."
BAD=0

# (a) forbidden tracked paths
PATHS=$(git ls-files | grep -E '^_source/|(^|/)\.dev\.vars|(^|/)\.env(\.|$)|CLAUDE\.local\.md|^\.probe/|^\.wrangler/|^\.open-next/|^node_modules/' | grep -vE '(^|/)\.env\.example$')
if [ -n "$PATHS" ]; then echo "FAIL tracked forbidden paths:"; echo "$PATHS"; BAD=1; else echo "PASS no forbidden tracked paths"; fi

# (b) forbidden content in tracked files (this script and its own pattern list are excluded)
HITS=$(git grep -nI -E 'CLOUDFLARE_API_TOKEN=[^ `"'"'"'$]|-----BEGIN [A-Z ]*PRIVATE KEY-----|(sk|rk)_live_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}' -- . ':(exclude)scripts/prepush-check.sh' ':(exclude)package-lock.json' || true)
if [ -n "$HITS" ]; then echo "FAIL secret-like content:"; echo "$HITS" | sed -E 's/(.{0,60}).*/\1/'; BAD=1; else echo "PASS no secret-like content"; fi

# (c) licences kept
for f in public/fonts/host-grotesk/OFL.txt public/fonts/ibm-plex-sans-arabic/OFL.txt _reference/liquid-glass-carousel/LICENSE; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then echo "PASS licence tracked $f"; else echo "FAIL licence missing or untracked $f"; BAD=1; fi
done

# (d) visibility, for the record
VIS=$(gh repo view Loomlyne/mansouri-media --json visibility -q .visibility 2>&1 | head -1)
echo "INFO repo visibility: ${VIS:-unknown}"

exit $BAD
