import requests

from ingestion import wikipedia_client


def _mock_response(mocker, payload: dict | None = None, status_code: int = 200):
    response = mocker.MagicMock()
    response.status_code = status_code
    if payload is not None:
        response.json.return_value = payload
    response.raise_for_status = mocker.MagicMock()
    return response


def test_fetch_summary_returns_extract_and_canonical_url(mocker):
    payload = {
        "extract": "The Battle of Waterloo was fought on 18 June 1815.",
        "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Battle_of_Waterloo"}},
    }
    mock_get = mocker.patch.object(
        wikipedia_client.requests, "get", return_value=_mock_response(mocker, payload)
    )

    summary = wikipedia_client.fetch_summary("Battle of Waterloo")

    assert summary is not None
    assert summary.extract == payload["extract"]
    assert summary.url == "https://en.wikipedia.org/wiki/Battle_of_Waterloo"
    _, kwargs = mock_get.call_args
    assert kwargs["headers"]["User-Agent"] == wikipedia_client.USER_AGENT


def test_fetch_summary_url_encodes_the_title(mocker):
    mock_get = mocker.patch.object(
        wikipedia_client.requests,
        "get",
        return_value=_mock_response(
            mocker,
            {
                "extract": "text",
                "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/X"}},
            },
        ),
    )

    wikipedia_client.fetch_summary("Battle of Waterloo (1815)")

    called_url = mock_get.call_args[0][0]
    assert "Battle_of_Waterloo" in called_url
    assert "%281815%29" in called_url


def test_fetch_summary_returns_none_on_404(mocker):
    mocker.patch.object(
        wikipedia_client.requests, "get", return_value=_mock_response(mocker, status_code=404)
    )

    assert wikipedia_client.fetch_summary("Does Not Exist") is None


def test_fetch_summary_returns_none_on_network_error(mocker):
    mocker.patch.object(
        wikipedia_client.requests,
        "get",
        side_effect=requests.ConnectionError("boom"),
    )

    assert wikipedia_client.fetch_summary("Battle of Waterloo") is None


def test_fetch_summary_returns_none_when_extract_is_missing(mocker):
    payload = {"content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/X"}}}
    mocker.patch.object(
        wikipedia_client.requests, "get", return_value=_mock_response(mocker, payload)
    )

    assert wikipedia_client.fetch_summary("Some Title") is None


def test_fetch_summary_returns_none_when_url_is_missing(mocker):
    payload = {"extract": "some text", "content_urls": {}}
    mocker.patch.object(
        wikipedia_client.requests, "get", return_value=_mock_response(mocker, payload)
    )

    assert wikipedia_client.fetch_summary("Some Title") is None
