from abc import ABC, abstractmethod

from app.domain.models import PositionSizing, StrategyDecision, TradeAction, TradeRecord


class MarketDataProvider(ABC):
    @abstractmethod
    def get_bars(self, symbol: str, timeframe: str, limit: int):
        raise NotImplementedError


class StrategyEngine(ABC):
    @abstractmethod
    def evaluate(self, candles) -> StrategyDecision:
        raise NotImplementedError


class RiskManager(ABC):
    @abstractmethod
    def calculate_position_size(
        self, account_equity: float, entry_price: float, stop_loss: float
    ) -> PositionSizing:
        raise NotImplementedError


class OrderExecutor(ABC):
    @abstractmethod
    def get_account_equity(self) -> float:
        raise NotImplementedError

    @abstractmethod
    def submit_order(
        self, symbol: str, action: TradeAction, quantity: int, stop_loss: float
    ) -> dict:
        raise NotImplementedError


class TradeLogger(ABC):
    @abstractmethod
    def log_trade(self, trade: TradeRecord) -> None:
        raise NotImplementedError
