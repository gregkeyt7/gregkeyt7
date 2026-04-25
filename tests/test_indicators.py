from app.indicators.technical import atr, ema, rsi


def test_ema_returns_expected_length() -> None:
    values = [1, 2, 3, 4, 5, 6]
    result = ema(values, period=3)
    assert len(result) == len(values)
    assert result[-1] > result[0]


def test_rsi_stays_within_bounds() -> None:
    values = [100, 101, 102, 103, 102, 101, 104, 107, 106, 108, 110, 109, 111, 112, 113]
    result = rsi(values, period=5)
    assert len(result) == len(values)
    assert all(0 <= point <= 100 for point in result)


def test_atr_returns_non_negative_values() -> None:
    highs = [11, 12, 13, 14, 13, 12, 13, 14, 15, 16]
    lows = [10, 10.5, 11, 12, 11.5, 10.8, 11.2, 12.4, 13.5, 14]
    closes = [10.5, 11, 12, 13, 12, 11, 12.5, 13.2, 14.7, 15]
    result = atr(highs, lows, closes, period=3)
    assert len(result) == len(highs)
    assert all(value >= 0 for value in result)
