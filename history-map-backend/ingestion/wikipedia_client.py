"""Fetches short-summary enrichment text for a Wikidata item's linked
English Wikipedia article, via Wikipedia's REST summary API.

Uses the API's own `content_urls.desktop.page` as `wikipedia_url` rather
than constructing a URL from the title -- that field is Wikipedia's own
canonical link (handles redirects/special characters correctly), so this
never fabricates or guesses a URL.

Uses `requests`, not `httpx`: verified empirically that Wikimedia's edge
returns 403 for httpx requests with a compliant User-Agent, while an
identical request made with `requests` succeeds -- see
`wikidata_client.py`'s module docstring for the full explanation.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote

import requests

from ingestion.http_utils import request_with_retry

WIKIPEDIA_SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"

USER_AGENT = (
    "eras-history-map-ingestion/0.1 "
    "(offline batch ingestion for a personal history-map project; contact via GitHub issues)"
)


@dataclass(frozen=True)
class WikipediaSummary:
    url: str
    extract: str


def fetch_summary(title: str, *, timeout: float = 30.0) -> WikipediaSummary | None:
    """Fetches the summary + canonical URL for `title`'s English Wikipedia
    article. Returns None if there's no article at that title, the request
    keeps failing (rate-limited or erroring) even after retries, or the
    response is otherwise missing an extract/URL -- callers should leave
    `wikipedia_url` null in that case rather than guessing one. Never
    raises: a single article's enrichment failing shouldn't abort a batch
    that's ingesting many events."""
    url = WIKIPEDIA_SUMMARY_ENDPOINT.format(title=quote(title.replace(" ", "_"), safe=""))
    try:
        response = request_with_retry(
            lambda: requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout),
            max_retries=3,
            base_delay=0.5,
        )
    except requests.RequestException:
        return None

    try:
        data = response.json()
    except ValueError:
        return None
    if not isinstance(data, dict):
        return None

    extract = data.get("extract")
    page_url = data.get("content_urls", {}).get("desktop", {}).get("page")
    if not isinstance(extract, str) or not extract or not isinstance(page_url, str) or not page_url:
        return None

    return WikipediaSummary(url=page_url, extract=extract)
