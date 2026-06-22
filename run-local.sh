#!/usr/bin/env bash
# Run the stack locally (no Docker required)
#   API  → FastAPI with SQLite, on port 8000
#   Web  → Next.js dev server, on port 3000
#   AI   → Ollama on port 11434 (optional — skipped if not installed)
set -e

API_PORT=8000
WEB_PORT=3000

# ── Prerequisites ────────────────────────────────────────────────────────────

check() {
  command -v "$1" >/dev/null 2>&1
}

check uv   || { echo "Error: 'uv' not found. Install: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
check node || { echo "Error: 'node' not found. Install via nvm or https://nodejs.org"; exit 1; }
check npm  || { echo "Error: 'npm' not found."; exit 1; }

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Cleanup on exit ──────────────────────────────────────────────────────────

cleanup() {
  echo ""
  echo "Shutting down..."
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "$WEB_PID" ]] && kill "$WEB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── Ollama (optional) ────────────────────────────────────────────────────────

if check ollama; then
  if ! pgrep -x ollama >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >/dev/null 2>&1 &
    sleep 2
  fi
  AI_MODEL="${AI_MODEL:-qwen2.5:0.5b}"
  echo "Pulling model $AI_MODEL (no-op if already cached)..."
  ollama pull "$AI_MODEL" 2>&1 | tail -1
  OLLAMA_URL="http://localhost:11434"
else
  echo "Ollama not found — AI assistant will be unavailable. Install from https://ollama.com"
  OLLAMA_URL="disabled"
fi

# ── API ──────────────────────────────────────────────────────────────────────

mkdir -p "$ROOT/apps/api/uploads"

echo ""
echo "Starting API..."
cd "$ROOT/apps/api"
DATABASE_URL="sqlite:///./plants.db" \
OLLAMA_URL="$OLLAMA_URL" \
AI_MODEL="${AI_MODEL:-qwen2.5:0.5b}" \
UPLOAD_DIR="$ROOT/apps/api/uploads" \
uv run uvicorn app.main:app --reload --port "$API_PORT" --log-level warning &
API_PID=$!

# Wait until the API responds
echo -n "Waiting for API..."
for i in $(seq 1 30); do
  curl -sf "http://localhost:$API_PORT/health" >/dev/null 2>&1 && break
  echo -n "."
  sleep 0.5
done
echo " ready."

# ── Web ──────────────────────────────────────────────────────────────────────

cd "$ROOT/apps/web"

if [ ! -d node_modules ]; then
  echo "Installing web dependencies..."
  npm install --silent
fi

# Remove Next.js cache dirs that Docker may have written as root
# (causes EACCES errors when switching between Docker and local runs)
rm -rf .next tmp 2>/dev/null || sudo rm -rf .next tmp 2>/dev/null || true

echo "Starting Next.js..."
API_INTERNAL_URL="http://localhost:$API_PORT" \
npm run dev -- --port "$WEB_PORT" &
WEB_PID=$!

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "  Web  → http://localhost:$WEB_PORT"
echo "  API  → http://localhost:$API_PORT"
[[ -n "$OLLAMA_URL" ]] && echo "  AI   → $OLLAMA_URL"
echo ""
echo "Press Ctrl+C to stop."

wait
