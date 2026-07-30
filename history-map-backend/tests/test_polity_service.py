from datetime import date
from unittest.mock import MagicMock

from app.services import polity_service

USA_RECORD = {"id": "polity-usa", "name": "United States of America"}


def test_get_polity_for_location_maps_record(mocker):
    mocker.patch.object(
        polity_service.polity_queries, "get_polity_for_location", return_value=USA_RECORD
    )

    polity = polity_service.get_polity_for_location(
        MagicMock(), "loc-philadelphia", date(1800, 1, 1)
    )

    assert polity is not None
    assert polity.id == "polity-usa"
    assert polity.name == "United States of America"


def test_get_polity_for_location_returns_none_when_no_polity_covers_that_date(mocker):
    mocker.patch.object(
        polity_service.polity_queries, "get_polity_for_location", return_value=None
    )

    polity = polity_service.get_polity_for_location(
        MagicMock(), "loc-philadelphia", date(1600, 1, 1)
    )

    assert polity is None
