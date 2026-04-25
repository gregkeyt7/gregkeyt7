from functools import lru_cache

from app.application.trading_service import TradingService
from app.core.config import Settings, get_settings
from app.db.session import get_session_factory
from app.market_data.alpaca_provider import AlpacaMarketDataProvider
from app.order_execution.alpaca_executor import AlpacaPaperExecutor
from app.risk_management.position_sizer import FixedFractionalRiskManager
from app.strategy.ema_rsi_atr import EmaRsiAtrStrategy
from app.trade_logging.repository import SqlAlchemyTradeLogger


@lru_cache
def get_app_settings() -> Settings:
    return get_settings()


@lru_cache
def get_market_data_provider() -> AlpacaMarketDataProvider:
    settings = get_app_settings()
    return AlpacaMarketDataProvider(
        api_key=settings.alpaca_api_key,
        api_secret=settings.alpaca_api_secret,
        data_url=settings.alpaca_data_url,
        timeout_seconds=settings.request_timeout_seconds,
    )


@lru_cache
def get_order_executor() -> AlpacaPaperExecutor:
    settings = get_app_settings()
    return AlpacaPaperExecutor(
        api_key=settings.alpaca_api_key,
        api_secret=settings.alpaca_api_secret,
        trading_url=settings.alpaca_base_url,
        allow_live_trading=settings.enable_live_trading,
        timeout_seconds=settings.request_timeout_seconds,
    )


@lru_cache
def get_strategy() -> EmaRsiAtrStrategy:
    settings = get_app_settings()
    return EmaRsiAtrStrategy(
        ema_fast_period=settings.ema_fast_period,
        ema_slow_period=settings.ema_slow_period,
        rsi_period=settings.rsi_period,
        rsi_long_threshold=settings.rsi_long_threshold,
        rsi_short_threshold=settings.rsi_short_threshold,
        atr_period=settings.atr_period,
        atr_stop_multiple=settings.atr_stop_multiple,
    )


@lru_cache
def get_risk_manager() -> FixedFractionalRiskManager:
    settings = get_app_settings()
    return FixedFractionalRiskManager(max_risk_per_trade=settings.max_risk_per_trade)


@lru_cache
def get_trade_logger() -> SqlAlchemyTradeLogger:
    settings = get_app_settings()
    session_factory = get_session_factory(settings.database_url)
    return SqlAlchemyTradeLogger(session_factory=session_factory)


@lru_cache
def get_trading_service() -> TradingService:
    settings = get_app_settings()
    return TradingService(
        market_data=get_market_data_provider(),
        strategy=get_strategy(),
        risk_manager=get_risk_manager(),
        order_executor=get_order_executor(),
        trade_logger=get_trade_logger(),
        timeframe=settings.default_timeframe,
        bars_lookback=settings.bars_lookback,
    )
