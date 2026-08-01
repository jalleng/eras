"""Shared HTTP retry/backoff helper for calls to WDQS and Wikipedia's REST
API. Both services can return 429 (rate limited) or transient 5xx/timeout
errors under sustained load; retrying with exponential backoff (honoring a
`Retry-After` header when present, for 429s) lets a larger batch ride out
transient blips instead of aborting the whole run on one bad request.
"""

from __future__ import annotations

import time
from collections.abc import Callable

import requests

_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def request_with_retry(
    make_request: Callable[[], requests.Response],
    *,
    max_retries: int = 4,
    base_delay: float = 1.0,
) -> requests.Response:
    """Calls `make_request()` (expected to perform one `requests.get(...)`),
    retrying with exponential backoff -- capped at `max_retries` additional
    attempts -- on connection errors, timeouts, or a 429/500/502/503/504
    response. A numeric `Retry-After` header on a 429 is honored in place of
    the computed backoff delay.

    Any other HTTP error status (e.g. 400, 404) raises immediately via
    `raise_for_status()`, uncaught -- retrying a request that's wrong in a
    way the server will never reconsider just wastes the remaining budget.
    """
    for attempt in range(max_retries + 1):
        try:
            response = make_request()
        except (requests.Timeout, requests.ConnectionError):
            if attempt >= max_retries:
                raise
            time.sleep(base_delay * (2**attempt))
            continue

        if response.status_code not in _RETRYABLE_STATUS_CODES or attempt >= max_retries:
            response.raise_for_status()
            return response

        delay = base_delay * (2**attempt)
        retry_after = response.headers.get("Retry-After")
        if retry_after is not None:
            try:
                delay = float(retry_after)
            except ValueError:
                pass
        time.sleep(delay)

    raise AssertionError("unreachable: loop above always returns or raises")
