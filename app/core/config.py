from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Paper Trading Bot"
    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/paper_trading"

    alpaca_api_key: str = "your_alpaca_api_key"
    alpaca_api_secret: str = "your_alpaca_api_secret"
    alpaca_base_url: str = "https://paper-api.alpaca.markets"
    alpaca_data_url: str = "https://data.alpaca.markets"
    enable_live_trading: bool = False

    default_symbol: str = "AAPL"
    default_timeframe: str = "1Min"

    max_risk_per_trade: float = Field(default=0.01, gt=0.0, le=0.01)

    ema_fast_period: int = Field(default=9, ge=2)
    ema_slow_period: int = Field(default=21, ge=3)
    rsi_period: int = Field(default=14, ge=2)
    rsi_long_threshold: float = Field(default=55.0, ge=0.0, le=100.0)
    rsi_short_threshold: float = Field(default=45.0, ge=0.0, le=100.0)
    atr_period: int = Field(default=14, ge=2)
    atr_stop_multiple: float = Field(default=2.0, gt=0.0)
    bars_lookback: int = Field(default=200, ge=50)

    request_timeout_seconds: int = Field(default=10, ge=1, le=60)

    @model_validator(mode="after")
    def validate_paper_trading_only(self) -> "Settings":
        if not self.enable_live_trading and "paper-api.alpaca.markets" not in self.alpaca_base_url:
            raise ValueError(
                "Live trading is disabled. Use Alpaca paper base URL and ask before enabling live trading."
            )

        if self.ema_fast_period >= self.ema_slow_period:
            raise ValueError("EMA fast period must be less than EMA slow period.")

        if self.rsi_long_threshold <= self.rsi_short_threshold:
            raise ValueError("RSI long threshold must be greater than RSI short threshold.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
