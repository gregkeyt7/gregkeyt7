#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker command not found."
  exit 1
fi
echo "OK: Docker detected"

echo "Checking docker compose..."
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose not available."
  exit 1
fi
echo "OK: Docker Compose detected"

echo "Checking containers..."
if docker ps --format '{{.Names}}' | rg '^jarvis-n8n$' >/dev/null; then
  echo "OK: jarvis-n8n running"
else
  echo "WARN: jarvis-n8n is not running"
fi

if docker ps --format '{{.Names}}' | rg '^jarvis-ollama$' >/dev/null; then
  echo "OK: jarvis-ollama running"
else
  echo "WARN: jarvis-ollama is not running"
fi

echo "Checking workflow JSON syntax..."
python3 - <<'PY'
import json
from pathlib import Path

workflow_dir = Path("workflows")
files = sorted(workflow_dir.glob("*.json"))
if not files:
    raise SystemExit("ERROR: no workflow JSON files found in workflows/")

for path in files:
    with path.open("r", encoding="utf-8") as f:
        json.load(f)
    print(f"OK: {path}")
PY

echo "Setup check complete."
