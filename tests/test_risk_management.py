import pytest

from app.risk_management.position_sizer import FixedFractionalRiskManager


def test_position_size_uses_max_one_percent_risk() -> None:
    manager = FixedFractionalRiskManager(max_risk_per_trade=0.01)

    sizing = manager.calculate_position_size(
        account_equity=10000,
        entry_price=100,
        stop_loss=98,
    )

    assert sizing.risk_amount == pytest.approx(100)
    assert sizing.risk_per_share == pytest.approx(2)
    assert sizing.quantity == 50


def test_invalid_risk_percent_raises() -> None:
    with pytest.raises(ValueError):
        FixedFractionalRiskManager(max_risk_per_trade=0.02)
