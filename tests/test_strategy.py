from datetime import datetime, timedelta, timezone

import app.strategy.ema_rsi_atr as strategy_module
from app.domain.models import Candle, TradeAction
from app.strategy.ema_rsi_atr import EmaRsiAtrStrategy


def _candles(count: int) -> list[Candle]:
    start = datetime.now(tz=timezone.utc)
    candles = []
    for index in range(count):
        close = 100 + index
        candles.append(
            Candle(
                timestamp=start + timedelta(minutes=index),
                open=close - 0.1,
                high=close + 0.2,
                low=close - 0.2,
                close=close,
                volume=1000,
            )
        )
    return candles


def test_strategy_generates_buy_on_cross_with_rsi_confirmation(monkeypatch) -> None:
    monkeypatch.setattr(
        strategy_module,
        "ema",
        lambda values, period: [1.0, 1.1, 1.2, 2.1] if period == 9 else [1.3, 1.25, 1.2, 1.5],
    )
    monkeypatch.setattr(strategy_module, "rsi", lambda values, period: [50.0, 52.0, 54.0, 60.0])
    monkeypatch.setattr(strategy_module, "atr", lambda highs, lows, closes, period: [1.0, 1.0, 1.0, 1.5])

    strategy = EmaRsiAtrStrategy(
        ema_fast_period=9,
        ema_slow_period=21,
        rsi_period=14,
        rsi_long_threshold=55,
        rsi_short_threshold=45,
        atr_period=14,
        atr_stop_multiple=2,
    )
    decision = strategy.evaluate(_candles(40))

    assert decision.action == TradeAction.BUY
    assert decision.stop_loss is not None
    assert decision.stop_loss < decision.entry_price


def test_strategy_generates_sell_on_cross_with_rsi_confirmation(monkeypatch) -> None:
    monkeypatch.setattr(
        strategy_module,
        "ema",
        lambda values, period: [2.0, 1.9, 1.8, 1.2] if period == 9 else [1.7, 1.75, 1.8, 1.6],
    )
    monkeypatch.setattr(strategy_module, "rsi", lambda values, period: [55.0, 50.0, 47.0, 35.0])
    monkeypatch.setattr(strategy_module, "atr", lambda highs, lows, closes, period: [1.0, 1.0, 1.0, 1.25])

    strategy = EmaRsiAtrStrategy(
        ema_fast_period=9,
        ema_slow_period=21,
        rsi_period=14,
        rsi_long_threshold=55,
        rsi_short_threshold=45,
        atr_period=14,
        atr_stop_multiple=2,
    )
    decision = strategy.evaluate(_candles(40))

    assert decision.action == TradeAction.SELL
    assert decision.stop_loss is not None
    assert decision.stop_loss > decision.entry_price
