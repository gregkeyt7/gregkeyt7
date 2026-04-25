from datetime import datetime

import requests

from app.domain.interfaces import MarketDataProvider
from app.domain.models import Candle


class AlpacaMarketDataProvider(MarketDataProvider):
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        data_url: str,
        timeout_seconds: int,
    ) -> None:
        self.base_url = data_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.session = requests.Session()
        self.session.headers.update(
            {
                "APCA-API-KEY-ID": api_key,
                "APCA-API-SECRET-KEY": api_secret,
            }
        )

    def get_bars(self, symbol: str, timeframe: str, limit: int):
        response = self.session.get(
            f"{self.base_url}/v2/stocks/{symbol}/bars",
            params={
                "timeframe": timeframe,
                "limit": limit,
                "adjustment": "raw",
                "feed": "iex",
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()

        payload = response.json()
        bars = payload.get("bars", [])
        if not bars:
            raise RuntimeError(f"No bars returned by Alpaca for symbol={symbol}")

        candles = []
        for bar in bars:
            candles.append(
                Candle(
                    timestamp=_parse_timestamp(bar["t"]),
                    open=float(bar["o"]),
                    high=float(bar["h"]),
                    low=float(bar["l"]),
                    close=float(bar["c"]),
                    volume=float(bar["v"]),
                )
            )

        return candles


def _parse_timestamp(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)
