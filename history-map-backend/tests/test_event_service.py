from datetime import date
from unittest.mock import MagicMock

from app.services import event_service

PHILADELPHIA_RECORD = {
    "id": "1776-declaration-of-independence",
    "title": "Declaration of Independence adopted",
    "description": "Adopted in Philadelphia.",
    "date_start": date(1776, 7, 4),
    "date_end": None,
    "latitude": 39.9496,
    "longitude": -75.1503,
    "wikipedia_url": "https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence",
    "region": "North America",
    "location": "Philadelphia, Pennsylvania",
}


def test_get_events_in_range_maps_records_to_event_response(mocker):
    mocker.patch.object(
        event_service.event_queries,
        "get_events_in_range",
        return_value=[PHILADELPHIA_RECORD],
    )

    events = event_service.get_events_in_range(
        MagicMock(), date(1776, 7, 1), date(1776, 7, 31)
    )

    assert len(events) == 1
    event = events[0]
    assert event.id == "1776-declaration-of-independence"
    assert event.date_start == date(1776, 7, 4)
    assert event.date_end is None
    assert event.wikipedia_url == "https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence"
    assert event.region == "North America"
    assert event.location == "Philadelphia, Pennsylvania"
    # Flat list responses don't populate the detail-only fields.
    assert event.location_detail is None
    assert event.people is None


def test_get_events_in_range_maps_multi_day_event_date_end(mocker):
    record = {
        **PHILADELPHIA_RECORD,
        "date_start": date(1962, 10, 25),
        "date_end": date(1962, 11, 14),
        "wikipedia_url": None,
    }
    mocker.patch.object(
        event_service.event_queries, "get_events_in_range", return_value=[record]
    )

    events = event_service.get_events_in_range(
        MagicMock(), date(1962, 10, 1), date(1962, 11, 30)
    )

    assert len(events) == 1
    assert events[0].date_start == date(1962, 10, 25)
    assert events[0].date_end == date(1962, 11, 14)
    assert events[0].wikipedia_url is None


def test_get_events_in_range_returns_empty_list_when_no_events(mocker):
    mocker.patch.object(
        event_service.event_queries, "get_events_in_range", return_value=[]
    )

    events = event_service.get_events_in_range(
        MagicMock(), date(1900, 1, 1), date(1900, 1, 2)
    )

    assert events == []


def test_get_event_by_id_populates_location_detail_and_people(mocker):
    record = {
        **PHILADELPHIA_RECORD,
        "location_detail": {
            "id": "loc-philadelphia",
            "name": "Philadelphia, Pennsylvania",
            "latitude": 39.9496,
            "longitude": -75.1503,
            "region": "North America",
        },
        "people": [{"id": "person-jefferson", "name": "Thomas Jefferson"}],
    }
    mocker.patch.object(event_service.event_queries, "get_event_by_id", return_value=record)

    event = event_service.get_event_by_id(MagicMock(), "1776-declaration-of-independence")

    assert event is not None
    assert event.location_detail is not None
    assert event.location_detail.id == "loc-philadelphia"
    assert event.people is not None
    assert event.people[0].name == "Thomas Jefferson"


def test_get_event_by_id_returns_none_when_not_found(mocker):
    mocker.patch.object(event_service.event_queries, "get_event_by_id", return_value=None)

    event = event_service.get_event_by_id(MagicMock(), "does-not-exist")

    assert event is None


def test_get_concurrent_events_maps_records(mocker):
    mocker.patch.object(
        event_service.event_queries,
        "get_concurrent_events",
        return_value=[PHILADELPHIA_RECORD],
    )

    events = event_service.get_concurrent_events(
        MagicMock(), "1776-cook-third-voyage-departs"
    )

    assert len(events) == 1
    assert events[0].id == "1776-declaration-of-independence"


def test_get_concurrent_events_returns_empty_list_when_none_connected(mocker):
    mocker.patch.object(
        event_service.event_queries, "get_concurrent_events", return_value=[]
    )

    events = event_service.get_concurrent_events(MagicMock(), "isolated-event")

    assert events == []
