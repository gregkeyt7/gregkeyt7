from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_app_settings, get_trading_service
from app.api.schemas import RunBotRequest, RunBotResponse
from app.application.trading_service import TradingService
from app.core.config import Settings

router = APIRouter(prefix="/api/v1", tags=["paper-trading"])


@router.get("/health")
def health(settings: Settings = Depends(get_app_settings)) -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "mode": "paper",
        "live_trading_enabled": settings.enable_live_trading,
    }


@router.post("/bot/run-once", response_model=RunBotResponse)
def run_bot_once(
    request: RunBotRequest,
    service: TradingService = Depends(get_trading_service),
    settings: Settings = Depends(get_app_settings),
) -> RunBotResponse:
    symbol = (request.symbol or settings.default_symbol).upper()

    try:
        result = service.run_once(symbol=symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Trading service failed: {exc}") from exc

    return RunBotResponse(
        symbol=result.symbol,
        action=result.action.value,
        reason=result.reason,
        quantity=result.quantity,
        entry_price=result.entry_price,
        stop_loss=result.stop_loss,
        broker_order_id=result.broker_order_id,
    )
