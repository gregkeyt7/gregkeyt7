from typing import Iterable

import pandas as pd


def ema(values: Iterable[float], period: int) -> list[float]:
    series = pd.Series(values, dtype=float)
    if series.empty:
        return []
    return series.ewm(span=period, adjust=False).mean().tolist()


def rsi(values: Iterable[float], period: int = 14) -> list[float]:
    series = pd.Series(values, dtype=float)
    if series.empty:
        return []

    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    relative_strength = avg_gain / avg_loss.replace(0, pd.NA)
    rsi_series = 100 - (100 / (1 + relative_strength))
    return rsi_series.fillna(50.0).tolist()


def atr(highs: Iterable[float], lows: Iterable[float], closes: Iterable[float], period: int = 14) -> list[float]:
    high = pd.Series(highs, dtype=float)
    low = pd.Series(lows, dtype=float)
    close = pd.Series(closes, dtype=float)

    if high.empty or low.empty or close.empty:
        return []

    prev_close = close.shift(1)
    true_range = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)

    atr_series = true_range.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    return atr_series.bfill().fillna(0.0).tolist()
