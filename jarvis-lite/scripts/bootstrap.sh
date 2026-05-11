#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env file. Copy .env.example first:"
  echo "  cp .env.example .env"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is required (docker compose)."
  exit 1
fi

echo "Starting n8n + Ollama..."
docker compose up -d

echo "Pulling default Ollama model from .env (this can take time)..."
MODEL_NAME="$(awk -F= '/^OLLAMA_MODEL=/{print $2}' .env)"
if [[ -z "${MODEL_NAME}" ]]; then
  MODEL_NAME="llama3.1:8b"
fi

docker exec jarvis-ollama ollama pull "${MODEL_NAME}"

echo
echo "Jarvis Lite is up."
echo "n8n URL: http://localhost:${N8N_PORT:-5678}"
echo "Ollama URL: http://localhost:11434"
echo
echo "Next steps:"
echo "1) Open n8n and create your owner account"
echo "2) Add Telegram + Google Sheets credentials"
echo "3) Import workflows from ./workflows"
