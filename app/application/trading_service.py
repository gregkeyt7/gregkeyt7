from app.domain.interfaces import MarketDataProvider, OrderExecutor, RiskManager, StrategyEngine, TradeLogger
from app.domain.models import TradeAction, TradeRecord, TradingRunResult


class TradingService:
    def __init__(
        self,
        market_data: MarketDataProvider,
        strategy: StrategyEngine,
        risk_manager: RiskManager,
        order_executor: OrderExecutor,
        trade_logger: TradeLogger,
        timeframe: str,
        bars_lookback: int,
    ) -> None:
        self.market_data = market_data
        self.strategy = strategy
        self.risk_manager = risk_manager
        self.order_executor = order_executor
        self.trade_logger = trade_logger
        self.timeframe = timeframe
        self.bars_lookback = bars_lookback

    def run_once(self, symbol: str) -> TradingRunResult:
        candles = self.market_data.get_bars(
            symbol=symbol,
            timeframe=self.timeframe,
            limit=self.bars_lookback,
        )

        decision = self.strategy.evaluate(candles)
        if decision.action == TradeAction.HOLD:
            return TradingRunResult(
                symbol=symbol,
                action=TradeAction.HOLD,
                reason=decision.reason,
                entry_price=decision.entry_price,
                stop_loss=decision.stop_loss,
            )

        if decision.entry_price is None or decision.stop_loss is None:
            return TradingRunResult(
                symbol=symbol,
                action=TradeAction.HOLD,
                reason="Signal missing entry or stop loss.",
            )

        account_equity = self.order_executor.get_account_equity()
        sizing = self.risk_manager.calculate_position_size(
            account_equity=account_equity,
            entry_price=decision.entry_price,
            stop_loss=decision.stop_loss,
        )

        if sizing.quantity <= 0:
            return TradingRunResult(
                symbol=symbol,
                action=TradeAction.HOLD,
                reason="Position size computed as zero based on risk constraints.",
                entry_price=decision.entry_price,
                stop_loss=decision.stop_loss,
            )

        execution_result = self.order_executor.submit_order(
            symbol=symbol,
            action=decision.action,
            quantity=sizing.quantity,
            stop_loss=decision.stop_loss,
        )

        self.trade_logger.log_trade(
            TradeRecord(
                symbol=symbol,
                action=decision.action,
                quantity=sizing.quantity,
                entry_price=decision.entry_price,
                stop_loss=decision.stop_loss,
                strategy_name=getattr(self.strategy, "name", "unknown"),
                reason=decision.reason,
                broker_order_id=execution_result.get("entry_order_id"),
            )
        )

        return TradingRunResult(
            symbol=symbol,
            action=decision.action,
            reason=decision.reason,
            quantity=sizing.quantity,
            entry_price=decision.entry_price,
            stop_loss=decision.stop_loss,
            broker_order_id=execution_result.get("entry_order_id"),
        )
