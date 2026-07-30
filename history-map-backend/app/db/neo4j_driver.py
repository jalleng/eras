from collections.abc import Iterator
from datetime import date
from functools import lru_cache
from typing import Any

from neo4j import Driver, GraphDatabase, Session

from app.config import get_settings


@lru_cache
def get_driver() -> Driver:
    """Returns a process-wide singleton Neo4j driver, created on first use."""
    settings = get_settings()
    return GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
    )


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a Neo4j session. Override with
    `app.dependency_overrides[get_db]` in tests to inject a fake session."""
    driver = get_driver()
    with driver.session() as session:
        yield session


def close_driver() -> None:
    """Closes the cached driver. Call once on application shutdown."""
    if get_driver.cache_info().currsize:
        get_driver().close()
    get_driver.cache_clear()


def coerce_date(value: Any) -> date:
    """Converts a Cypher `date` property to a native `datetime.date`.

    The real driver returns `neo4j.time.Date` (which has `.to_native()`);
    unit tests commonly stub query results with a plain `datetime.date` or
    an ISO string, so both are accepted too.
    """
    if isinstance(value, date):
        return value
    to_native = getattr(value, "to_native", None)
    if callable(to_native):
        return to_native()
    return date.fromisoformat(str(value))
