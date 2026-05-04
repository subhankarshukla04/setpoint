#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIDS_DIR="$ROOT/.pids"
LOGS_DIR="$ROOT/logs"
mkdir -p "$PIDS_DIR" "$LOGS_DIR"

[[ -f "$ROOT/.env" ]] && set -a && source "$ROOT/.env" && set +a

KB_PORT="${KNOWLEDGE_SERVICE_PORT:-8003}"
WEB_PORT="${WEB_PORT:-3001}"

start_kb() {
  local pidfile="$PIDS_DIR/knowledge-service.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[kb]  already running (pid $(cat "$pidfile"))"; return
  fi
  echo "[kb]  starting on :$KB_PORT"
  (
    cd "$ROOT"
    KB_WIKI_DIR="$ROOT/research/wiki" \
    KB_CITATIONS="$ROOT/research/citations.json" \
    KB_DB_PATH="$ROOT/services/knowledge-service/data/kb.sqlite" \
    APP_DB_PATH="$ROOT/data/cutrack.db" \
    nohup services/knowledge-service/.venv/bin/python \
      -m uvicorn app.main:app \
      --app-dir services/knowledge-service \
      --host 0.0.0.0 --port "$KB_PORT" \
      > "$LOGS_DIR/knowledge-service.log" 2>&1 &
    echo $! > "$pidfile"
  )
}

start_web() {
  local pidfile="$PIDS_DIR/web.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[web] already running (pid $(cat "$pidfile"))"; return
  fi
  echo "[web] starting on :$WEB_PORT"
  (
    cd "$ROOT/apps/web"
    nohup npm run dev > "$LOGS_DIR/web.log" 2>&1 &
    echo $! > "$pidfile"
  )
}

start_kb
start_web
sleep 2

HOST="$(ipconfig getifaddr en0 2>/dev/null || echo localhost)"
echo
echo "Up:"
echo "  laptop: http://localhost:$WEB_PORT"
echo "  phone:  http://macbook.local:$WEB_PORT  (or http://$HOST:$WEB_PORT)"
echo "  kb api: http://localhost:$KB_PORT/health"
echo
echo "Stop with: bash infra/scripts/dev-down.sh"
