import uuid

import requests

from app.domain.interfaces import OrderExecutor
from app.domain.models import TradeAction


class AlpacaPaperExecutor(OrderExecutor):
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        trading_url: str,
        allow_live_trading: bool,
        timeout_seconds: int,
    ) -> None:
        self.base_url = trading_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

        if not allow_live_trading and "paper-api.alpaca.markets" not in self.base_url:
            raise ValueError(
                "Live trading disabled. Use Alpaca paper endpoint and ask before enabling live trading."
            )

        self.session = requests.Session()
        self.session.headers.update(
            {
                "APCA-API-KEY-ID": api_key,
                "APCA-API-SECRET-KEY": api_secret,
                "Content-Type": "application/json",
            }
        )

    def get_account_equity(self) -> float:
        response = self.session.get(f"{self.base_url}/v2/account", timeout=self.timeout_seconds)
        response.raise_for_status()
        payload = response.json()
        return float(payload.get("equity", 0.0))

    def submit_order(self, symbol: str, action: TradeAction, quantity: int, stop_loss: float) -> dict:
        if quantity <= 0:
            raise ValueError("Order quantity must be greater than zero.")

        entry_order_payload = {
            "symbol": symbol,
            "qty": str(quantity),
            "side": action.value,
            "type": "market",
            "time_in_force": "day",
            "client_order_id": f"paper-{uuid.uuid4().hex[:24]}",
        }
        entry_order_response = self.session.post(
            f"{self.base_url}/v2/orders",
            json=entry_order_payload,
            timeout=self.timeout_seconds,
        )
        entry_order_response.raise_for_status()
        entry_order = entry_order_response.json()

        stop_side = TradeAction.SELL.value if action == TradeAction.BUY else TradeAction.BUY.value
        stop_order_payload = {
            "symbol": symbol,
            "qty": str(quantity),
            "side": stop_side,
            "type": "stop",
            "time_in_force": "gtc",
            "stop_price": round(float(stop_loss), 2),
            "client_order_id": f"paper-stop-{uuid.uuid4().hex[:20]}",
        }
        stop_order_response = self.session.post(
            f"{self.base_url}/v2/orders",
            json=stop_order_payload,
            timeout=self.timeout_seconds,
        )
        stop_order_response.raise_for_status()
        stop_order = stop_order_response.json()

        return {
            "entry_order_id": entry_order.get("id"),
            "stop_order_id": stop_order.get("id"),
            "entry_order": entry_order,
            "stop_order": stop_order,
        }
