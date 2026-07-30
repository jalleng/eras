from datetime import date

from neo4j import ManagedTransaction, Session


def _polity_for_location_tx(
    tx: ManagedTransaction, location_id: str, target_date: str
) -> dict | None:
    # end_date IS NULL means the location's membership in that polity is
    # still current; start_date IS NULL means it predates any date this
    # dataset needs to resolve (e.g. "ruled by X since antiquity").
    result = tx.run(
        """
        MATCH (l:Location {id: $location_id})-[rel:PART_OF]->(p:Polity)
        WHERE (rel.start_date IS NULL OR rel.start_date <= date($target_date))
          AND (rel.end_date IS NULL OR rel.end_date >= date($target_date))
        RETURN p.id AS id, p.name AS name
        LIMIT 1
        """,
        location_id=location_id,
        target_date=target_date,
    )
    records = result.data()
    return records[0] if records else None


def get_polity_for_location(
    session: Session, location_id: str, target_date: date
) -> dict | None:
    return session.execute_read(
        _polity_for_location_tx, location_id, target_date.isoformat()
    )
