# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Paper Trading Bot** built with FastAPI, SQLAlchemy, PostgreSQL, and the Alpaca paper-trading API. It uses a clean architecture layout with the main app code under `app/` and tests under `tests/`.

The actual application code lives on the `cursor/paper-trading-bot-setup-067d` branch (the `main` branch only has a placeholder README). Make sure to check out that branch before doing any development work.

### Running Tests

Tests use SQLite in-memory and mock Alpaca credentials (configured in `tests/conftest.py`), so **no external services are needed**.

```bash
source .venv/bin/activate
PYTHONPATH=/workspace pytest -v
```

**Important:** You must set `PYTHONPATH=/workspace` when running pytest, because the project has no `pyproject.toml` or `setup.py` — without it, `import app` will fail with `ModuleNotFoundError`.

### Running the App

1. Ensure PostgreSQL is running: `pg_ctlcluster 16 main start`
2. Ensure the `paper_trading` database exists (auto-created during initial setup).
3. Ensure `.env` exists (copy from `.env.example` if missing).
4. Start the dev server:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Key Endpoints

- `GET /api/v1/health` — health check (works without Alpaca keys)
- `POST /api/v1/bot/run-once` — execute one trade cycle (requires valid Alpaca API keys in `.env`)

### Gotchas

- **No linter is configured** in `requirements.txt`. Use `python3 -m py_compile <file>` for syntax checks.
- The app auto-creates database tables on startup via `create_db_and_tables()` in the lifespan handler — no Alembic migrations exist.
- PostgreSQL `pg_hba.conf` must allow `md5` auth for local TCP connections (default Ubuntu install uses `peer`).
- The `run-once` endpoint will return a 500 with `401 Client Error` if Alpaca credentials are placeholder values; this is expected behavior without real API keys.
