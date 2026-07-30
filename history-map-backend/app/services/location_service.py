from neo4j import Session

from app.db.queries import location_queries
from app.models.location import LocationResponse


def _to_location_response(record: dict) -> LocationResponse:
    return LocationResponse(
        id=record["id"],
        name=record["name"],
        latitude=record["latitude"],
        longitude=record["longitude"],
        region=record["region"],
    )


def get_location_by_id(session: Session, location_id: str) -> LocationResponse | None:
    record = location_queries.get_location_by_id(session, location_id)
    return _to_location_response(record) if record else None


def get_nearest_location(
    session: Session, latitude: float, longitude: float
) -> LocationResponse | None:
    record = location_queries.get_nearest_location(session, latitude, longitude)
    return _to_location_response(record) if record else None
