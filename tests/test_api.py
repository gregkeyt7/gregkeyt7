from fastapi.testclient import TestClient

from app.api.dependencies import get_trading_service
from app.domain.models import TradeAction, TradingRunResult
from app.main import create_app


class FakeTradingService:
    def run_once(self, symbol: str) -> TradingRunResult:
        return TradingRunResult(
            symbol=symbol,
            action=TradeAction.HOLD,
            reason="No crossover.",
            quantity=0,
        )


def test_health_endpoint_reports_paper_mode() -> None:
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["mode"] == "paper"


def test_run_once_endpoint_uses_service_dependency_override() -> None:
    app = create_app()
    app.dependency_overrides[get_trading_service] = lambda: FakeTradingService()

    with TestClient(app) as client:
        response = client.post("/api/v1/bot/run-once", json={"symbol": "MSFT"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["symbol"] == "MSFT"
    assert payload["action"] == "hold"
    assert payload["quantity"] == 0
