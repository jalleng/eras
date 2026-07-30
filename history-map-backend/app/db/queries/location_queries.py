from neo4j import ManagedTransaction, Session


def _location_by_id_tx(tx: ManagedTransaction, location_id: str) -> dict | None:
    result = tx.run(
        """
        MATCH (l:Location {id: $location_id})-[:IN_REGION]->(r:Region)
        RETURN l.id AS id, l.name AS name, l.latitude AS latitude,
               l.longitude AS longitude, r.name AS region
        """,
        location_id=location_id,
    )
    records = result.data()
    return records[0] if records else None


def get_location_by_id(session: Session, location_id: str) -> dict | None:
    return session.execute_read(_location_by_id_tx, location_id)


def _nearest_location_tx(
    tx: ManagedTransaction, latitude: float, longitude: float
) -> dict | None:
    # point()/point.distance() are core Cypher functions (no APOC/GDS plugin
    # needed), so this works unmodified on Neo4j Aura's free tier. Distance
    # between two WGS-84 points is computed geodesically, in meters.
    result = tx.run(
        """
        MATCH (l:Location)-[:IN_REGION]->(r:Region)
        WITH l, r,
             point({latitude: l.latitude, longitude: l.longitude}) AS location_point,
             point({latitude: $latitude, longitude: $longitude}) AS query_point
        RETURN l.id AS id, l.name AS name, l.latitude AS latitude,
               l.longitude AS longitude, r.name AS region,
               point.distance(location_point, query_point) AS distance_meters
        ORDER BY distance_meters ASC
        LIMIT 1
        """,
        latitude=latitude,
        longitude=longitude,
    )
    records = result.data()
    return records[0] if records else None


def get_nearest_location(
    session: Session, latitude: float, longitude: float
) -> dict | None:
    return session.execute_read(_nearest_location_tx, latitude, longitude)
