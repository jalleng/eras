from datetime import date

from neo4j import ManagedTransaction, Session


def _events_in_range_tx(
    tx: ManagedTransaction, start_date: str, end_date: str
) -> list[dict]:
    result = tx.run(
        """
        MATCH (e:Event)-[:OCCURRED_AT]->(l:Location)-[:IN_REGION]->(r:Region)
        WHERE e.date >= date($start_date) AND e.date <= date($end_date)
        RETURN e.id AS id, e.title AS title, e.description AS description,
               e.date AS iso_date, e.latitude AS latitude, e.longitude AS longitude,
               r.name AS region, l.name AS location
        ORDER BY e.date ASC
        """,
        start_date=start_date,
        end_date=end_date,
    )
    return result.data()


def get_events_in_range(
    session: Session, start_date: date, end_date: date
) -> list[dict]:
    """Returns events whose date falls within [start_date, end_date], each
    flattened with its location name and region (joined via :Location/:Region)."""
    return session.execute_read(
        _events_in_range_tx, start_date.isoformat(), end_date.isoformat()
    )


def _event_by_id_tx(tx: ManagedTransaction, event_id: str) -> dict | None:
    result = tx.run(
        """
        MATCH (e:Event {id: $event_id})-[:OCCURRED_AT]->(l:Location)-[:IN_REGION]->(r:Region)
        OPTIONAL MATCH (e)-[:INVOLVED]->(p:Person)
        WITH e, l, r, collect(p) AS people_nodes
        RETURN e.id AS id, e.title AS title, e.description AS description,
               e.date AS iso_date, e.latitude AS latitude, e.longitude AS longitude,
               r.name AS region, l.name AS location,
               {id: l.id, name: l.name, latitude: l.latitude,
                longitude: l.longitude, region: r.name} AS location_detail,
               [person IN people_nodes WHERE person IS NOT NULL |
                {id: person.id, name: person.name}] AS people
        """,
        event_id=event_id,
    )
    records = result.data()
    return records[0] if records else None


def get_event_by_id(session: Session, event_id: str) -> dict | None:
    """Returns a single event with its full location detail and involved
    people, or None if no event with that id exists."""
    return session.execute_read(_event_by_id_tx, event_id)


def _concurrent_events_tx(tx: ManagedTransaction, event_id: str) -> list[dict]:
    result = tx.run(
        """
        MATCH (:Event {id: $event_id})-[:CONCURRENT_WITH]-(other:Event)
              -[:OCCURRED_AT]->(l:Location)-[:IN_REGION]->(r:Region)
        RETURN DISTINCT other.id AS id, other.title AS title, other.description AS description,
               other.date AS iso_date, other.latitude AS latitude, other.longitude AS longitude,
               r.name AS region, l.name AS location
        ORDER BY other.date ASC
        """,
        event_id=event_id,
    )
    return result.data()


def get_concurrent_events(session: Session, event_id: str) -> list[dict]:
    """Returns every event connected to `event_id` via :CONCURRENT_WITH
    (undirected — seed.py only creates the relationship once per pair)."""
    return session.execute_read(_concurrent_events_tx, event_id)
