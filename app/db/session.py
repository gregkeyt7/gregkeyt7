from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base


@lru_cache
def get_engine(database_url: str):
    return create_engine(database_url, pool_pre_ping=True)


@lru_cache
def get_session_factory(database_url: str):
    engine = get_engine(database_url)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def create_db_and_tables(database_url: str) -> None:
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
