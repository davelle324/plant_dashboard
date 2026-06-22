#!/usr/bin/env bash
# Ensure the uv virtual environment exists in apps/api, then activate it.
# Usage: source activate_env.sh

API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/apps/api" && pwd)"

if [ ! -d "$API_DIR/.venv" ]; then
  echo "No .venv found — running 'uv sync' in apps/api..."
  (cd "$API_DIR" && uv sync)
fi

# shellcheck disable=SC1091
source "$API_DIR/.venv/bin/activate"
echo "Activated: $API_DIR/.venv"
