from unittest.mock import MagicMock

from app.services import location_service

PHILADELPHIA_RECORD = {
    "id": "loc-philadelphia",
    "name": "Philadelphia, Pennsylvania",
    "latitude": 39.9496,
    "longitude": -75.1503,
    "region": "North America",
}


def test_get_location_by_id_maps_record(mocker):
    mocker.patch.object(
        location_service.location_queries,
        "get_location_by_id",
        return_value=PHILADELPHIA_RECORD,
    )

    location = location_service.get_location_by_id(MagicMock(), "loc-philadelphia")

    assert location is not None
    assert location.id == "loc-philadelphia"
    assert location.region == "North America"


def test_get_location_by_id_returns_none_when_not_found(mocker):
    mocker.patch.object(
        location_service.location_queries, "get_location_by_id", return_value=None
    )

    location = location_service.get_location_by_id(MagicMock(), "does-not-exist")

    assert location is None


def test_get_nearest_location_maps_record(mocker):
    mocker.patch.object(
        location_service.location_queries,
        "get_nearest_location",
        return_value=PHILADELPHIA_RECORD,
    )

    location = location_service.get_nearest_location(MagicMock(), 40.0, -75.0)

    assert location is not None
    assert location.name == "Philadelphia, Pennsylvania"


def test_get_nearest_location_returns_none_when_no_locations_exist(mocker):
    mocker.patch.object(
        location_service.location_queries, "get_nearest_location", return_value=None
    )

    location = location_service.get_nearest_location(MagicMock(), 0.0, 0.0)

    assert location is None
