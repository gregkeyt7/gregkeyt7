from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class TradeAction(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass(frozen=True)
class Candle:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass(frozen=True)
class StrategyDecision:
    action: TradeAction
    reason: str
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    atr_value: Optional[float] = None
    rsi_value: Optional[float] = None


@dataclass(frozen=True)
class PositionSizing:
    quantity: int
    risk_amount: float
    risk_per_share: float


@dataclass(frozen=True)
class TradeRecord:
    symbol: str
    action: TradeAction
    quantity: int
    entry_price: float
    stop_loss: float
    strategy_name: str
    reason: str
    broker_order_id: Optional[str] = None


@dataclass(frozen=True)
class TradingRunResult:
    symbol: str
    action: TradeAction
    reason: str
    quantity: int = 0
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    broker_order_id: Optional[str] = None
