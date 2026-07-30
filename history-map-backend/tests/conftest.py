import os
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from neo4j import Session, Transaction

from app.db.neo4j_driver import get_db
from app.main import app


def pytest_collection_modifyitems(
    config: pytest.Config, items: list[pytest.Item]
) -> None:
    """Skip @pytest.mark.integration tests unless RUN_INTEGRATION_TESTS=1 is set."""
    if os.environ.get("RUN_INTEGRATION_TESTS") == "1":
        return
    skip_integration = pytest.mark.skip(
        reason="set RUN_INTEGRATION_TESTS=1 to run tests against a real Neo4j instance"
    )
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration)


@pytest.fixture
def mock_tx() -> MagicMock:
    """A fake Neo4j transaction. Configure `mock_tx.run.return_value.data.return_value`
    to control what a query function's `tx.run(...).data()` call returns."""
    return MagicMock(spec=Transaction)


@pytest.fixture
def mock_session(mock_tx: MagicMock) -> MagicMock:
    """A fake Neo4j session whose execute_read/execute_write immediately invoke
    the given work function with `mock_tx`, so real query-layer code
    (`session.execute_read(work)` -> `work(tx)` -> `tx.run(...).data()`) still
    runs — only the actual network/driver is faked out."""
    session = MagicMock(spec=Session)
    session.execute_read.side_effect = lambda work, *a, **kw: work(mock_tx, *a, **kw)
    session.execute_write.side_effect = lambda work, *a, **kw: work(mock_tx, *a, **kw)
    return session


@pytest.fixture
def client(mock_session: MagicMock) -> Iterator[TestClient]:
    """A TestClient with `get_db` overridden to yield the mocked session, so
    route tests exercise the real router -> service -> query-function stack
    without a live Neo4j connection."""

    def override_get_db() -> Iterator[MagicMock]:
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
