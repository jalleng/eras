from datetime import date

from neo4j import Session

from app.db.neo4j_driver import coerce_date
from app.db.queries import event_queries
from app.models.event import EventResponse
from app.models.location import LocationResponse
from app.models.person import PersonResponse


def _to_event_response(record: dict) -> EventResponse:
    return EventResponse(
        id=record["id"],
        title=record["title"],
        description=record["description"],
        iso_date=coerce_date(record["iso_date"]),
        latitude=record["latitude"],
        longitude=record["longitude"],
        region=record["region"],
        location=record["location"],
    )


def get_events_in_range(
    session: Session, start_date: date, end_date: date
) -> list[EventResponse]:
    records = event_queries.get_events_in_range(session, start_date, end_date)
    return [_to_event_response(record) for record in records]


def get_event_by_id(session: Session, event_id: str) -> EventResponse | None:
    record = event_queries.get_event_by_id(session, event_id)
    if record is None:
        return None
    event = _to_event_response(record)
    event.location_detail = LocationResponse(**record["location_detail"])
    event.people = [PersonResponse(**person) for person in record["people"]]
    return event


def get_concurrent_events(session: Session, event_id: str) -> list[EventResponse]:
    records = event_queries.get_concurrent_events(session, event_id)
    return [_to_event_response(record) for record in records]
