import math

from app.domain.interfaces import RiskManager
from app.domain.models import PositionSizing


class FixedFractionalRiskManager(RiskManager):
    def __init__(self, max_risk_per_trade: float) -> None:
        if max_risk_per_trade <= 0 or max_risk_per_trade > 0.01:
            raise ValueError("max_risk_per_trade must be greater than 0 and at most 0.01")
        self.max_risk_per_trade = max_risk_per_trade

    def calculate_position_size(
        self, account_equity: float, entry_price: float, stop_loss: float
    ) -> PositionSizing:
        if account_equity <= 0:
            return PositionSizing(quantity=0, risk_amount=0.0, risk_per_share=0.0)

        risk_amount = account_equity * self.max_risk_per_trade
        risk_per_share = abs(entry_price - stop_loss)

        if risk_per_share <= 0:
            return PositionSizing(quantity=0, risk_amount=risk_amount, risk_per_share=risk_per_share)

        quantity = max(math.floor(risk_amount / risk_per_share), 0)
        return PositionSizing(
            quantity=quantity,
            risk_amount=risk_amount,
            risk_per_share=risk_per_share,
        )
