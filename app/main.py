from fastapi import FastAPI

from app.api.routes import router as api_router
from app.core.config import get_settings
from app.db import models  # noqa: F401
from app.db.session import create_db_and_tables


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    @app.on_event("startup")
    def startup_event() -> None:
        create_db_and_tables(settings.database_url)

    app.include_router(api_router)
    return app


app = create_app()
