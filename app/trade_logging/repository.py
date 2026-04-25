from sqlalchemy.orm import sessionmaker

from app.db.models import TradeLogModel
from app.domain.interfaces import TradeLogger
from app.domain.models import TradeRecord


class SqlAlchemyTradeLogger(TradeLogger):
    def __init__(self, session_factory: sessionmaker) -> None:
        self.session_factory = session_factory

    def log_trade(self, trade: TradeRecord) -> None:
        with self.session_factory() as session:
            row = TradeLogModel(
                symbol=trade.symbol,
                action=trade.action,
                quantity=trade.quantity,
                entry_price=trade.entry_price,
                stop_loss=trade.stop_loss,
                strategy_name=trade.strategy_name,
                reason=trade.reason,
                broker_order_id=trade.broker_order_id,
            )
            session.add(row)
            session.commit()
