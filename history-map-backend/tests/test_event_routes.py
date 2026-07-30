from unittest.mock import MagicMock

from fastapi.testclient import TestClient

PHILADELPHIA_ROW = {
    "id": "1776-declaration-of-independence",
    "title": "Declaration of Independence adopted",
    "description": "Adopted in Philadelphia.",
    "iso_date": "1776-07-04",
    "latitude": 39.9496,
    "longitude": -75.1503,
    "region": "North America",
    "location": "Philadelphia, Pennsylvania",
}


def test_list_events_returns_flat_event_shape(client: TestClient, mock_tx: MagicMock):
    mock_tx.run.return_value.data.return_value = [PHILADELPHIA_ROW]

    response = client.get(
        "/events", params={"start_date": "1776-07-01", "end_date": "1776-07-31"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body == [
        {
            "id": "1776-declaration-of-independence",
            "title": "Declaration of Independence adopted",
            "description": "Adopted in Philadelphia.",
            "isoDate": "1776-07-04",
            "latitude": 39.9496,
            "longitude": -75.1503,
            "region": "North America",
            "location": "Philadelphia, Pennsylvania",
            "locationDetail": None,
            "people": None,
        }
    ]


def test_list_events_returns_empty_list_when_no_events(
    client: TestClient, mock_tx: MagicMock
):
    mock_tx.run.return_value.data.return_value = []

    response = client.get(
        "/events", params={"start_date": "1900-01-01", "end_date": "1900-01-02"}
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_event_by_id_returns_location_detail_and_people(
    client: TestClient, mock_tx: MagicMock
):
    mock_tx.run.return_value.data.return_value = [
        {
            **PHILADELPHIA_ROW,
            "location_detail": {
                "id": "loc-philadelphia",
                "name": "Philadelphia, Pennsylvania",
                "latitude": 39.9496,
                "longitude": -75.1503,
                "region": "North America",
            },
            "people": [{"id": "person-jefferson", "name": "Thomas Jefferson"}],
        }
    ]

    response = client.get("/events/1776-declaration-of-independence")

    assert response.status_code == 200
    body = response.json()
    assert body["locationDetail"]["id"] == "loc-philadelphia"
    assert body["people"] == [{"id": "person-jefferson", "name": "Thomas Jefferson"}]


def test_get_event_by_id_returns_404_when_missing(client: TestClient, mock_tx: MagicMock):
    mock_tx.run.return_value.data.return_value = []

    response = client.get("/events/does-not-exist")

    assert response.status_code == 404


def test_list_concurrent_events(client: TestClient, mock_tx: MagicMock):
    mock_tx.run.return_value.data.return_value = [PHILADELPHIA_ROW]

    response = client.get("/events/1776-cook-third-voyage-departs/concurrent")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "1776-declaration-of-independence"
