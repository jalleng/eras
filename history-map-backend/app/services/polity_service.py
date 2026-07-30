from datetime import date

from neo4j import Session

from app.db.queries import polity_queries
from app.models.polity import PolityResponse


def _to_polity_response(record: dict) -> PolityResponse:
    return PolityResponse(id=record["id"], name=record["name"])


def get_polity_for_location(
    session: Session, location_id: str, target_date: date
) -> PolityResponse | None:
    record = polity_queries.get_polity_for_location(session, location_id, target_date)
    return _to_polity_response(record) if record else None
