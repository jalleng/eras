import requests

from ingestion.http_utils import request_with_retry


def _mock_response(mocker, status_code: int = 200, headers: dict | None = None):
    response = mocker.MagicMock()
    response.status_code = status_code
    response.headers = headers or {}
    response.raise_for_status = mocker.MagicMock()
    if status_code >= 400:
        response.raise_for_status.side_effect = requests.HTTPError(
            f"{status_code} error", response=response
        )
    return response


def test_returns_response_on_first_success(mocker):
    sleep = mocker.patch("ingestion.http_utils.time.sleep")
    response = _mock_response(mocker, 200)
    make_request = mocker.Mock(return_value=response)

    result = request_with_retry(make_request)

    assert result is response
    make_request.assert_called_once()
    sleep.assert_not_called()


def test_retries_on_429_then_succeeds(mocker):
    sleep = mocker.patch("ingestion.http_utils.time.sleep")
    rate_limited = _mock_response(mocker, 429)
    ok = _mock_response(mocker, 200)
    make_request = mocker.Mock(side_effect=[rate_limited, ok])

    result = request_with_retry(make_request, max_retries=3, base_delay=1.0)

    assert result is ok
    assert make_request.call_count == 2
    sleep.assert_called_once_with(1.0)


def test_honors_retry_after_header_on_429(mocker):
    sleep = mocker.patch("ingestion.http_utils.time.sleep")
    rate_limited = _mock_response(mocker, 429, headers={"Retry-After": "5"})
    ok = _mock_response(mocker, 200)
    make_request = mocker.Mock(side_effect=[rate_limited, ok])

    request_with_retry(make_request, max_retries=3, base_delay=1.0)

    sleep.assert_called_once_with(5.0)


def test_retries_on_connection_error_then_succeeds(mocker):
    sleep = mocker.patch("ingestion.http_utils.time.sleep")
    ok = _mock_response(mocker, 200)
    make_request = mocker.Mock(side_effect=[requests.ConnectionError("boom"), ok])

    result = request_with_retry(make_request, max_retries=3, base_delay=1.0)

    assert result is ok
    sleep.assert_called_once_with(1.0)


def test_raises_after_exhausting_retries_on_persistent_5xx(mocker):
    mocker.patch("ingestion.http_utils.time.sleep")
    always_down = _mock_response(mocker, 503)
    make_request = mocker.Mock(return_value=always_down)

    try:
        request_with_retry(make_request, max_retries=2, base_delay=0.01)
        raised = False
    except requests.HTTPError:
        raised = True

    assert raised
    assert make_request.call_count == 3  # initial attempt + 2 retries


def test_does_not_retry_non_retryable_client_error(mocker):
    sleep = mocker.patch("ingestion.http_utils.time.sleep")
    not_found = _mock_response(mocker, 404)
    make_request = mocker.Mock(return_value=not_found)

    try:
        request_with_retry(make_request, max_retries=3)
        raised = False
    except requests.HTTPError:
        raised = True

    assert raised
    make_request.assert_called_once()
    sleep.assert_not_called()


def test_raises_after_exhausting_retries_on_persistent_connection_error(mocker):
    mocker.patch("ingestion.http_utils.time.sleep")
    make_request = mocker.Mock(side_effect=requests.ConnectionError("still down"))

    try:
        request_with_retry(make_request, max_retries=2, base_delay=0.01)
        raised = False
    except requests.ConnectionError:
        raised = True

    assert raised
    assert make_request.call_count == 3
