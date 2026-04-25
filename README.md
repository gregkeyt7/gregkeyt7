# Paper Trading Bot (FastAPI + Alpaca + PostgreSQL)

Production-oriented **paper trading** bot scaffold using Python, FastAPI, Alpaca API, PostgreSQL, and a modular strategy engine.

## Safety Guarantee

- This project is configured for **paper trading only**.
- Live trading is explicitly blocked by configuration validation unless `ENABLE_LIVE_TRADING=true` and paper endpoint safeguards are adjusted.
- **Do not enable live trading without explicit approval. Ask before adding live trading.**

## Strategy Implemented

- EMA 9 / EMA 21 crossover
- RSI confirmation
- ATR-based stop loss
- Max 1% account risk per trade

## Clean Architecture Layout

```text
app/
  api/               # FastAPI routes, schemas, dependency wiring
  application/       # Use-case orchestration (trading service)
  core/              # Configuration and app-level concerns
  db/                # SQLAlchemy models and DB session factory
  domain/            # Core entities and interface contracts
  indicators/        # Technical indicators (EMA/RSI/ATR)
  market_data/       # Alpaca market data adapter
  order_execution/   # Alpaca paper order execution adapter
  risk_management/   # Position sizing and risk controls
  strategy/          # Strategy engine (EMA/RSI/ATR)
  trade_logging/     # Trade persistence module
tests/               # Unit + API tests
```

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Alpaca paper account API credentials

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment template and configure values:

```bash
cp .env.example .env
```

4. Ensure PostgreSQL is running and `DATABASE_URL` points to your DB.

5. Start the API server:

```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /api/v1/health` - Service health and paper-mode status
- `POST /api/v1/bot/run-once` - Run one strategy evaluation/trade cycle

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/bot/run-once \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

## Testing

```bash
pytest -q
```

## Notes for Production Hardening

- Add auth for API routes
- Add idempotency and circuit-breakers around broker calls
- Add scheduling/worker process for automated recurring runs
- Add observability (metrics, structured logs, tracing)
- Add migration management (Alembic)

## Important

This repository intentionally avoids real-money trading flows at this stage.
Before adding live trading support, **ask for explicit approval**.
