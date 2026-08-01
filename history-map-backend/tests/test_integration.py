"""Integration tests against a real Neo4j instance.

Skipped by default (see conftest.py's pytest_collection_modifyitems).
Run with: RUN_INTEGRATION_TESTS=1 uv run pytest -m integration

Requires a real .env with NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD pointing at
a reachable Neo4j instance (Aura or otherwise). Seeds a small, self-
contained dataset (distinct from the curated dataset) and cleans it up
afterward regardless of outcome.
"""

from datetime import date

import pytest

from app.db.neo4j_driver import get_driver
from app.db.queries import event_queries, location_queries, polity_queries

TEST_PREFIX = "test-integration-"


@pytest.fixture
def real_session():
    driver = get_driver()
    with driver.session() as session:
        yield session
        session.run(
            "MATCH (n) WHERE n.id STARTS WITH $prefix DETACH DELETE n",
            prefix=TEST_PREFIX,
        )
        session.run(
            "MATCH (r:Region {name: $region_name}) DETACH DELETE r",
            region_name="IntegrationTestRegion",
        )


@pytest.mark.integration
def test_seed_and_query_events_end_to_end(real_session):
    session = real_session

    session.run(
        """
        MERGE (r:Region {name: 'IntegrationTestRegion'})
        ON CREATE SET r.id = 'integration-test-region'
        MERGE (l:Location {id: $location_id})
        SET l.name = 'Test City', l.latitude = 10.0, l.longitude = 20.0
        MERGE (l)-[:IN_REGION]->(r)
        MERGE (e1:Event {id: $event_1_id})
        SET e1.title = 'Test Event One', e1.description = 'First test event',
            e1.date_start = date('2000-01-01'), e1.latitude = 10.0, e1.longitude = 20.0,
            e1.source = 'integration test'
        MERGE (e1)-[:OCCURRED_AT]->(l)
        MERGE (e2:Event {id: $event_2_id})
        SET e2.title = 'Test Event Two', e2.description = 'Second test event',
            e2.date_start = date('2000-01-01'), e2.latitude = 30.0, e2.longitude = 40.0,
            e2.source = 'integration test'
        MERGE (e2)-[:OCCURRED_AT]->(l)
        MERGE (e1)-[:CONCURRENT_WITH]-(e2)
        MERGE (p:Polity {id: $polity_id})
        SET p.name = 'Test Polity'
        MERGE (l)-[rel:PART_OF]->(p)
        SET rel.start_date = date('1990-01-01'), rel.end_date = null
        """,
        location_id=f"{TEST_PREFIX}location",
        event_1_id=f"{TEST_PREFIX}event-1",
        event_2_id=f"{TEST_PREFIX}event-2",
        polity_id=f"{TEST_PREFIX}polity",
    )

    events = event_queries.get_events_in_range(session, date(2000, 1, 1), date(2000, 1, 1))
    event_ids = {record["id"] for record in events}
    assert f"{TEST_PREFIX}event-1" in event_ids
    assert f"{TEST_PREFIX}event-2" in event_ids

    event = event_queries.get_event_by_id(session, f"{TEST_PREFIX}event-1")
    assert event is not None
    assert event["location"] == "Test City"
    assert event["region"] == "IntegrationTestRegion"

    concurrent = event_queries.get_concurrent_events(session, f"{TEST_PREFIX}event-1")
    assert {record["id"] for record in concurrent} == {f"{TEST_PREFIX}event-2"}

    nearest = location_queries.get_nearest_location(session, 10.0, 20.0)
    assert nearest is not None
    assert nearest["id"] == f"{TEST_PREFIX}location"

    polity = polity_queries.get_polity_for_location(
        session, f"{TEST_PREFIX}location", date(2020, 1, 1)
    )
    assert polity is not None
    assert polity["id"] == f"{TEST_PREFIX}polity"
