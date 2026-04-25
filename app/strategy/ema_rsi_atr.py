from app.domain.interfaces import StrategyEngine
from app.domain.models import StrategyDecision, TradeAction
from app.indicators.technical import atr, ema, rsi


class EmaRsiAtrStrategy(StrategyEngine):
    name = "ema9_ema21_rsi_atr"

    def __init__(
        self,
        ema_fast_period: int,
        ema_slow_period: int,
        rsi_period: int,
        rsi_long_threshold: float,
        rsi_short_threshold: float,
        atr_period: int,
        atr_stop_multiple: float,
    ) -> None:
        self.ema_fast_period = ema_fast_period
        self.ema_slow_period = ema_slow_period
        self.rsi_period = rsi_period
        self.rsi_long_threshold = rsi_long_threshold
        self.rsi_short_threshold = rsi_short_threshold
        self.atr_period = atr_period
        self.atr_stop_multiple = atr_stop_multiple

    def evaluate(self, candles) -> StrategyDecision:
        minimum_bars = max(self.ema_slow_period, self.rsi_period, self.atr_period) + 2
        if len(candles) < minimum_bars:
            return StrategyDecision(
                action=TradeAction.HOLD,
                reason=f"Need at least {minimum_bars} candles for signal generation.",
            )

        closes = [candle.close for candle in candles]
        highs = [candle.high for candle in candles]
        lows = [candle.low for candle in candles]

        ema_fast = ema(closes, self.ema_fast_period)
        ema_slow = ema(closes, self.ema_slow_period)
        rsi_values = rsi(closes, self.rsi_period)
        atr_values = atr(highs, lows, closes, self.atr_period)

        prev_fast, curr_fast = ema_fast[-2], ema_fast[-1]
        prev_slow, curr_slow = ema_slow[-2], ema_slow[-1]
        curr_rsi = rsi_values[-1]
        curr_atr = atr_values[-1]
        entry_price = closes[-1]

        crossed_up = prev_fast <= prev_slow and curr_fast > curr_slow
        crossed_down = prev_fast >= prev_slow and curr_fast < curr_slow

        if crossed_up and curr_rsi >= self.rsi_long_threshold:
            stop_loss = entry_price - (curr_atr * self.atr_stop_multiple)
            return StrategyDecision(
                action=TradeAction.BUY,
                reason="Bullish EMA crossover with RSI confirmation.",
                entry_price=entry_price,
                stop_loss=stop_loss,
                atr_value=curr_atr,
                rsi_value=curr_rsi,
            )

        if crossed_down and curr_rsi <= self.rsi_short_threshold:
            stop_loss = entry_price + (curr_atr * self.atr_stop_multiple)
            return StrategyDecision(
                action=TradeAction.SELL,
                reason="Bearish EMA crossover with RSI confirmation.",
                entry_price=entry_price,
                stop_loss=stop_loss,
                atr_value=curr_atr,
                rsi_value=curr_rsi,
            )

        return StrategyDecision(
            action=TradeAction.HOLD,
            reason="No EMA crossover with matching RSI confirmation.",
            entry_price=entry_price,
            atr_value=curr_atr,
            rsi_value=curr_rsi,
        )
