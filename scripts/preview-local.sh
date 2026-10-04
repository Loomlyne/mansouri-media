#!/usr/bin/env bash
# Build the Worker and run it locally in workerd on port 8791.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(lsof -nP -iTCP:8791 -sTCP:LISTEN -t)" ]; then
  echo "port 8791 busy" >&2
  exit 1
fi

./node_modules/.bin/opennextjs-cloudflare build
HOME=/Users/koss/.mansouri-cloudflare exec ./node_modules/.bin/opennextjs-cloudflare preview --port 8791
