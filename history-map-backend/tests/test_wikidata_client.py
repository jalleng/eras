from unittest.mock import MagicMock

import pytest
import requests

from ingestion import wikidata_client


@pytest.fixture(autouse=True)
def _no_sleep(mocker):
    # fetch_events() sleeps between its two WDQS calls to be a good citizen
    # of rate limits; that real delay has no place slowing down unit tests.
    mocker.patch.object(wikidata_client.time, "sleep")

POINT_BINDING = {
    "item": {"type": "uri", "value": "http://www.wikidata.org/entity/Q182881"},
    "itemLabel": {"type": "literal", "value": "Battle of Waterloo", "xml:lang": "en"},
    "coord": {"type": "literal", "value": "Point(4.4 50.68)"},
    "pointInTime": {
        "type": "literal",
        "value": "1815-06-18T00:00:00Z",
        "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",
    },
}

RANGE_BINDING = {
    "item": {"type": "uri", "value": "http://www.wikidata.org/entity/Q1000001"},
    "itemLabel": {"type": "literal", "value": "Battle of Wavre", "xml:lang": "en"},
    "coord": {"type": "literal", "value": "Point(4.6 50.72)"},
    "startTime": {"type": "literal", "value": "1815-06-18T00:00:00Z"},
    "endTime": {"type": "literal", "value": "1815-06-19T00:00:00Z"},
}


def _mock_response(mocker, payload: dict, status_code: int = 200) -> MagicMock:
    response = mocker.MagicMock()
    response.status_code = status_code
    response.json.return_value = payload
    response.raise_for_status = mocker.MagicMock()
    return response


def test_build_point_in_time_query_includes_date_bounds_and_event_classes():
    query = wikidata_client.build_point_in_time_query("1815-06-15", "1815-06-22")

    assert "1815-06-15T00:00:00Z" in query
    assert "1815-06-22T23:59:59Z" in query
    for qid in wikidata_client.EVENT_CLASSES:
        assert f"wd:{qid}" in query
    assert "wdt:P625" in query
    assert "wdt:P585" in query


def test_build_range_query_includes_start_bound_and_event_classes():
    query = wikidata_client.build_range_query("1815-06-15", "1815-06-22")

    assert "1815-06-22T23:59:59Z" in query
    # Lower bound: start_date minus _MAX_EVENT_SPAN_DAYS, so ancient/unrelated
    # events with only a start time don't crowd out real matches within LIMIT.
    assert "1815-03-17T00:00:00Z" in query
    for qid in wikidata_client.EVENT_CLASSES:
        assert f"wd:{qid}" in query
    assert "wdt:P625" in query
    assert "wdt:P580" in query
    assert "wdt:P582" in query


def test_fetch_events_merges_bindings_from_both_queries(mocker):
    point_payload = {"results": {"bindings": [POINT_BINDING]}}
    range_payload = {"results": {"bindings": [RANGE_BINDING]}}
    mock_get = mocker.patch.object(
        wikidata_client.requests,
        "get",
        side_effect=[
            _mock_response(mocker, point_payload),
            _mock_response(mocker, range_payload),
        ],
    )

    bindings = wikidata_client.fetch_events("1815-06-15", "1815-06-22")

    assert len(bindings) == 2
    assert mock_get.call_count == 2
    _, kwargs = mock_get.call_args_list[0]
    assert kwargs["headers"]["User-Agent"] == wikidata_client.USER_AGENT
    assert kwargs["params"]["format"] == "json"


def test_fetch_events_dedupes_by_item_preferring_point_in_time(mocker):
    same_item_as_range = {
        **POINT_BINDING,
        "item": RANGE_BINDING["item"],
    }
    point_payload = {"results": {"bindings": [same_item_as_range]}}
    range_payload = {"results": {"bindings": [RANGE_BINDING]}}
    mocker.patch.object(
        wikidata_client.requests,
        "get",
        side_effect=[
            _mock_response(mocker, point_payload),
            _mock_response(mocker, range_payload),
        ],
    )

    bindings = wikidata_client.fetch_events("1815-06-15", "1815-06-22")

    assert len(bindings) == 1
    assert "pointInTime" in bindings[0]


def test_fetch_events_raises_on_http_error_status(mocker):
    response = _mock_response(mocker, {})
    response.raise_for_status.side_effect = requests.HTTPError("boom", response=response)
    mocker.patch.object(wikidata_client.requests, "get", return_value=response)

    try:
        wikidata_client.fetch_events("1815-06-15", "1815-06-22")
        raised = False
    except requests.HTTPError:
        raised = True
    assert raised


def test_fetch_events_treats_missing_results_key_as_empty(mocker):
    mocker.patch.object(
        wikidata_client.requests,
        "get",
        return_value=_mock_response(mocker, {"unexpected": "shape"}),
    )

    assert wikidata_client.fetch_events("1815-06-15", "1815-06-22") == []


def test_fetch_events_treats_non_dict_top_level_response_as_empty(mocker):
    mocker.patch.object(
        wikidata_client.requests,
        "get",
        return_value=_mock_response(mocker, ["not", "a", "dict"]),
    )

    assert wikidata_client.fetch_events("1815-06-15", "1815-06-22") == []


def test_fetch_events_treats_non_list_bindings_as_empty(mocker):
    payload = {"results": {"bindings": "not-a-list"}}
    mocker.patch.object(
        wikidata_client.requests, "get", return_value=_mock_response(mocker, payload)
    )

    assert wikidata_client.fetch_events("1815-06-15", "1815-06-22") == []


def test_fetch_events_retries_a_rate_limited_query_then_succeeds(mocker):
    rate_limited = _mock_response(mocker, {})
    rate_limited.status_code = 429
    point_payload = {"results": {"bindings": [POINT_BINDING]}}
    range_payload = {"results": {"bindings": [RANGE_BINDING]}}
    mocker.patch.object(
        wikidata_client.requests,
        "get",
        side_effect=[
            rate_limited,
            _mock_response(mocker, point_payload),
            _mock_response(mocker, range_payload),
        ],
    )

    bindings = wikidata_client.fetch_events("1815-06-15", "1815-06-22")

    assert len(bindings) == 2


def test_fetch_events_treats_malformed_json_as_empty(mocker):
    response = _mock_response(mocker, {})
    response.json.side_effect = ValueError("not json")
    mocker.patch.object(wikidata_client.requests, "get", return_value=response)

    assert wikidata_client.fetch_events("1815-06-15", "1815-06-22") == []
