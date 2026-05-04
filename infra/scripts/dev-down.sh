#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIDS_DIR="$ROOT/.pids"
for pidfile in "$PIDS_DIR"/*.pid; do
  [[ -f "$pidfile" ]] || continue
  pid="$(cat "$pidfile")"
  name="$(basename "$pidfile" .pid)"
  if kill -0 "$pid" 2>/dev/null; then
    echo "[$name] stopping pid $pid"
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$pidfile"
done
