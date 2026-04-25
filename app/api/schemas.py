from typing import Optional

from pydantic import BaseModel, Field


class RunBotRequest(BaseModel):
    symbol: Optional[str] = Field(default=None, min_length=1, max_length=10)


class RunBotResponse(BaseModel):
    symbol: str
    action: str
    reason: str
    quantity: int
    entry_price: float | None = None
    stop_loss: float | None = None
    broker_order_id: str | None = None
