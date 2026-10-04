#!/usr/bin/env bash
# Usage: scripts/tail-capture.sh start|stop <name>
# start: wrangler tail (JSON) in the background, output .probe/tail-<name>.jsonl, PID .probe/tail-<name>.pid
# stop: kills only the PID recorded by start (and that PID's direct children). Never pattern-kills.
set -euo pipefail
cd "$(dirname "$0")/.."
cmd=${1:-}; name=${2:-}
[ -n "$cmd" ] && [ -n "$name" ] || { echo "usage: $0 start|stop <name>" >&2; exit 2; }
mkdir -p .probe
out=.probe/tail-$name.jsonl
err=.probe/tail-$name.err
pidf=.probe/tail-$name.pid
case "$cmd" in
  start)
    [ ! -f "$pidf" ] || { echo "already started (pid $(cat "$pidf"))" >&2; exit 1; }
    : > "$out"
    nohup bash scripts/wr.sh tail mansourimedia --format json > "$out" 2> "$err" &
    echo $! > "$pidf"
    for _ in $(seq 1 30); do
      if grep -qi "connected" "$err" "$out" 2>/dev/null; then echo "tail connected (pid $(cat "$pidf"))"; exit 0; fi
      sleep 1
    done
    echo "tail started (pid $(cat "$pidf")); no 'connected' line seen yet" ;;
  stop)
    [ -f "$pidf" ] || { echo "no pid file" >&2; exit 1; }
    pid=$(cat "$pidf")
    # wr.sh exec()s wrangler, so the PID is wrangler itself; also stop its direct children.
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
    rm -f "$pidf"
    echo "stopped $pid; $(wc -l < "$out" | tr -d ' ') lines in $out" ;;
  *) echo "usage: $0 start|stop <name>" >&2; exit 2 ;;
esac
