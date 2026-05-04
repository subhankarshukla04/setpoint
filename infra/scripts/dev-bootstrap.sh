#!/usr/bin/env bash
# One-shot: create knowledge-service venv + install Python deps, then npm install for web.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

command -v python3 >/dev/null || { echo "python3 missing"; exit 1; }
command -v npm     >/dev/null || { echo "npm missing"; exit 1; }

KB="$ROOT/services/knowledge-service"
if [[ ! -d "$KB/.venv" ]]; then
  echo "[kb] creating venv"
  python3 -m venv "$KB/.venv"
fi
echo "[kb] installing deps"
"$KB/.venv/bin/pip" install -q --upgrade pip
"$KB/.venv/bin/pip" install -q -r "$KB/requirements.txt"

echo "[web] installing deps"
( cd "$ROOT/apps/web" && npm install --silent --no-audit --no-fund )

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo
  echo ".env created from .env.example — paste OPENROUTER_API_KEY before starting Coach."
fi

echo
echo "Done. Start with: bash infra/scripts/dev-up.sh"
