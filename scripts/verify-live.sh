#!/usr/bin/env bash
# Usage: bash scripts/verify-live.sh <base-url> <mode>... [--env local|preview|production] [--team <team-name>]
# Modes: public | media | admin. Curl only. Prints PASS / FAIL lines, exits 1 on any FAIL.
set -uo pipefail

BASE=${1:-}
[ -n "$BASE" ] || { echo "usage: $0 <base-url> <mode>... [--env e] [--team t]" >&2; exit 2; }
shift
BASE=${BASE%/}
MODES=()
ENVNAME=""
TEAM=""
while [ $# -gt 0 ]; do
  case "$1" in
    --env) ENVNAME=${2:-}; shift 2 ;;
    --team) TEAM=${2:-}; shift 2 ;;
    public|media|admin) MODES+=("$1"); shift ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done

FAILS=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1 got=[$2] expected=[$3]"; FAILS=$((FAILS + 1)); }
eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "$2" "$3"; fi; }
has() { if printf '%s' "$2" | grep -qiF -- "$3"; then pass "$1"; else fail "$1" "missing" "$3"; fi; }

# status <path> [curl args...] -> http code (no redirect follow)
status() { local p=$1; shift; curl -s -o /dev/null -w '%{http_code}' --path-as-is "$@" "$BASE$p"; }
# header <path> <name> [curl args...] -> value of header (lowercased name, trimmed)
header() {
  local p=$1 n=$2; shift 2
  curl -s -o /dev/null -D - --path-as-is "$@" "$BASE$p" | tr -d '\r' | awk -v n="$(printf '%s' "$n" | tr 'A-Z' 'a-z')" '
    { i = index($0, ":"); if (i > 0 && tolower(substr($0, 1, i - 1)) == n) { v = substr($0, i + 1); sub(/^ +/, "", v); print v; exit } }'
}

mode_public() {
  for l in en ar fr; do
    local body ct code
    body=$(curl -s -D /tmp/vl-h.$$ "$BASE/$l")
    code=$(head -1 /tmp/vl-h.$$ | awk '{print $2}')
    ct=$(grep -i '^content-type:' /tmp/vl-h.$$ | tr -d '\r' | head -1)
    eq "public /$l status" "$code" 200
    has "public /$l content-type" "$ct" text/html
    has "public /$l whatsapp" "$body" "wa.me/971505085753"
    has "public /$l email" "$body" "mailto:houssemansouri96@gmail.com"
    if [ "$l" = ar ]; then has "public /ar rtl" "$body" 'dir="rtl"'; fi
  done
  rm -f /tmp/vl-h.$$
  eq "public / accept-language ar" "$(status / -H 'Accept-Language: ar') $(header / location -H 'Accept-Language: ar')" "307 /ar"
  eq "public / accept-language fr-FR" "$(status / -H 'Accept-Language: fr-FR') $(header / location -H 'Accept-Language: fr-FR')" "307 /fr"
  eq "public / no accept-language" "$(status /) $(header / location)" "307 /en"
  eq "public /en/does-not-exist" "$(status /en/does-not-exist)" 404
  eq "public nosniff" "$(header /en x-content-type-options)" nosniff
  eq "public x-frame-options" "$(header /en x-frame-options)" DENY
  eq "public OFL licence" "$(status /fonts/host-grotesk/OFL.txt)" 200
}

mode_media() {
  local film=/media/_probe/test-9x16.mp4 n etag
  n=$(header $film content-length -I)
  [ -n "$n" ] || n=$(curl -s -I --path-as-is "$BASE$film" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  [ -n "$n" ] && pass "media film size $n" || fail "media film size" "" "number"
  local code
  code=$(status $film -H 'Range: bytes=0-1')
  eq "media range first status" "$code" 206
  eq "media content-range" "$(header $film content-range -H 'Range: bytes=0-1')" "bytes 0-1/$n"
  eq "media accept-ranges" "$(header $film accept-ranges -H 'Range: bytes=0-1')" bytes
  eq "media content-length" "$(header $film content-length -H 'Range: bytes=0-1')" 2
  eq "media bytes returned" "$(curl -s --path-as-is -H 'Range: bytes=0-1' "$BASE$film" | wc -c | tr -d ' ')" 2
  local code2
  code2=$(status $film -H 'Range: bytes=0-1')
  if [ "$code" = 206 ] && [ "$code2" = 206 ]; then pass "cold-and-cached: first 206, repeat 206"; else fail "cold-and-cached" "$code/$code2" "206/206"; fi
  eq "media range open end" "$(status $film -H 'Range: bytes=1000000-')" 206
  eq "media range past end" "$(status $film -H 'Range: bytes=999999999-')" 416
  etag=$(curl -s -I --path-as-is "$BASE$film" | tr -d '\r' | awk 'tolower($1)=="etag:"{print $2}')
  eq "media if-none-match" "$(status $film -H "If-None-Match: $etag")" 304
  eq "media cors header" "$(curl -s -I --path-as-is "$BASE$film" | tr -d '\r' | awk 'tolower($1)=="access-control-allow-origin:"{print $2}')" '*'
  eq "media poster status" "$(status /media/_probe/poster.webp)" 200
  eq "media poster type" "$(header /media/_probe/poster.webp content-type)" image/webp
  if [ -n "$ENVNAME" ]; then
    eq "media env marker" "$(curl -s --path-as-is "$BASE/media/_probe/env.txt" | tr -d '\r\n')" "$ENVNAME"
  fi
  eq "media POST" "$(status $film -X POST)" 405
  eq "media traversal" "$(status '/media/..%2F..%2Fx')" 404
}

mode_admin() {
  local p c
  for p in /admin /admin/ /admin/lab /api/admin/ping /ADMIN //admin /%61dmin /api//admin/ping; do
    c=$(status "$p")
    if [ "$c" != 200 ]; then pass "admin $p not 200 ($c)"; else fail "admin $p" "$c" "not 200"; fi
    c=$(status "$p" -H 'cf-access-jwt-assertion: forged')
    if [ "$c" != 200 ]; then pass "admin $p forged jwt not 200 ($c)"; else fail "admin $p forged jwt" "$c" "not 200"; fi
  done
  if [ -n "$TEAM" ]; then
    eq "admin redirect status" "$(status /admin)" 302
    has "admin redirect host" "$(header /admin location)" "$TEAM.cloudflareaccess.com"
  fi
}

for m in "${MODES[@]}"; do
  case "$m" in
    public) mode_public ;;
    media) mode_media ;;
    admin) mode_admin ;;
  esac
done

if [ "$FAILS" -gt 0 ]; then echo "$FAILS check(s) failed"; exit 1; fi
echo "all checks passed"
