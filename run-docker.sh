#!/usr/bin/env bash
# Run the full stack in Docker (Postgres + API + Web + Ollama)
set -e

command -v docker >/dev/null 2>&1 || { echo "Error: docker not found."; exit 1; }

echo "Starting Plant Care app in Docker..."
echo "  Web  → http://localhost:3000"
echo "  API  → http://localhost:8000"
echo ""
echo "First run will pull the Ollama model (~400 MB). Subsequent starts skip this."
echo "To wipe the database and start fresh: docker compose down -v"
echo ""

docker-compose up --build "$@"
