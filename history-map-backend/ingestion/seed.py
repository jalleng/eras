"""Loads ingestion/curated_events.py into Neo4j.

Idempotent (uses MERGE throughout) — safe to re-run.

Usage: uv run python -m ingestion.seed
"""

from itertools import combinations

from neo4j import ManagedTransaction, Session

from app.db.neo4j_driver import close_driver, get_driver
from ingestion.curated_events import EVENTS, LOCATIONS, PEOPLE, POLITY_ASSIGNMENTS


def _slugify_region_name(name: str) -> str:
    return name.lower().replace(" ", "-")


def _seed_region_tx(tx: ManagedTransaction, name: str, region_id: str) -> None:
    tx.run(
        """
        MERGE (r:Region {name: $name})
        ON CREATE SET r.id = $region_id
        """,
        name=name,
        region_id=region_id,
    )


def _seed_location_tx(
    tx: ManagedTransaction,
    location_id: str,
    name: str,
    latitude: float,
    longitude: float,
    region: str,
) -> None:
    tx.run(
        """
        MATCH (r:Region {name: $region})
        MERGE (l:Location {id: $location_id})
        SET l.name = $name, l.latitude = $latitude, l.longitude = $longitude
        MERGE (l)-[:IN_REGION]->(r)
        """,
        location_id=location_id,
        name=name,
        latitude=latitude,
        longitude=longitude,
        region=region,
    )


def _seed_person_tx(tx: ManagedTransaction, person_id: str, name: str) -> None:
    tx.run(
        "MERGE (p:Person {id: $person_id}) SET p.name = $name",
        person_id=person_id,
        name=name,
    )


def _seed_event_tx(
    tx: ManagedTransaction,
    event_id: str,
    title: str,
    description: str,
    date_start: str,
    date_end: str | None,
    latitude: float,
    longitude: float,
    source: str,
    location_id: str,
    wikipedia_url: str | None,
) -> None:
    tx.run(
        """
        MATCH (l:Location {id: $location_id})
        MERGE (e:Event {id: $event_id})
        SET e.title = $title, e.description = $description,
            e.date_start = date($date_start),
            e.date_end = CASE WHEN $date_end IS NULL THEN NULL ELSE date($date_end) END,
            e.latitude = $latitude, e.longitude = $longitude, e.source = $source,
            e.wikipedia_url = $wikipedia_url
        REMOVE e.date
        MERGE (e)-[:OCCURRED_AT]->(l)
        """,
        event_id=event_id,
        title=title,
        description=description,
        date_start=date_start,
        date_end=date_end,
        latitude=latitude,
        longitude=longitude,
        source=source,
        location_id=location_id,
        wikipedia_url=wikipedia_url,
    )


def _seed_involved_tx(tx: ManagedTransaction, event_id: str, person_id: str) -> None:
    tx.run(
        """
        MATCH (e:Event {id: $event_id}), (p:Person {id: $person_id})
        MERGE (e)-[:INVOLVED]->(p)
        """,
        event_id=event_id,
        person_id=person_id,
    )


def _seed_polity_assignment_tx(
    tx: ManagedTransaction,
    location_id: str,
    polity_id: str,
    polity_name: str,
    start_date: str | None,
    end_date: str | None,
) -> None:
    tx.run(
        """
        MERGE (p:Polity {id: $polity_id})
        SET p.name = $polity_name
        WITH p
        MATCH (l:Location {id: $location_id})
        MERGE (l)-[rel:PART_OF]->(p)
        SET rel.start_date = CASE WHEN $start_date IS NULL THEN NULL ELSE date($start_date) END,
            rel.end_date = CASE WHEN $end_date IS NULL THEN NULL ELSE date($end_date) END
        """,
        location_id=location_id,
        polity_id=polity_id,
        polity_name=polity_name,
        start_date=start_date,
        end_date=end_date,
    )


def _seed_concurrent_with_tx(tx: ManagedTransaction, id_a: str, id_b: str) -> None:
    tx.run(
        """
        MATCH (a:Event {id: $id_a}), (b:Event {id: $id_b})
        MERGE (a)-[:CONCURRENT_WITH]-(b)
        """,
        id_a=id_a,
        id_b=id_b,
    )


def seed(session: Session) -> None:
    region_names = sorted({location.region for location in LOCATIONS})
    for name in region_names:
        session.execute_write(_seed_region_tx, name, _slugify_region_name(name))
    print(f"Seeded {len(region_names)} regions")

    for location in LOCATIONS:
        session.execute_write(
            _seed_location_tx,
            location.id,
            location.name,
            location.latitude,
            location.longitude,
            location.region,
        )
    print(f"Seeded {len(LOCATIONS)} locations")

    for person in PEOPLE:
        session.execute_write(_seed_person_tx, person.id, person.name)
    print(f"Seeded {len(PEOPLE)} people")

    for event in EVENTS:
        session.execute_write(
            _seed_event_tx,
            event.id,
            event.title,
            event.description,
            event.date_start,
            event.date_end,
            event.latitude,
            event.longitude,
            event.source,
            event.location_id,
            event.wikipedia_url,
        )
        for person_id in event.person_ids:
            session.execute_write(_seed_involved_tx, event.id, person_id)
    print(f"Seeded {len(EVENTS)} events")

    for assignment in POLITY_ASSIGNMENTS:
        session.execute_write(
            _seed_polity_assignment_tx,
            assignment.location_id,
            assignment.polity_id,
            assignment.polity_name,
            assignment.start_date,
            assignment.end_date,
        )
    print(f"Seeded {len(POLITY_ASSIGNMENTS)} polity assignments")

    clusters: dict[str, list[str]] = {}
    for event in EVENTS:
        clusters.setdefault(event.cluster, []).append(event.id)

    pair_count = 0
    for event_ids in clusters.values():
        for id_a, id_b in combinations(event_ids, 2):
            session.execute_write(_seed_concurrent_with_tx, id_a, id_b)
            pair_count += 1
    print(f"Seeded {pair_count} CONCURRENT_WITH relationships across {len(clusters)} clusters")


def main() -> None:
    driver = get_driver()
    with driver.session() as session:
        seed(session)
    close_driver()


if __name__ == "__main__":
    main()
