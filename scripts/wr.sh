#!/usr/bin/env bash
# The only entry point for wrangler on this Mac: Houssem's account only.
set -euo pipefail
export HOME=/Users/koss/.mansouri-cloudflare
cd "$(dirname "$0")/.."
node scripts/cf-guard.mjs
exec ./node_modules/.bin/wrangler "$@"
