"""SPARQL query builder and HTTP client for the Wikidata Query Service (WDQS).

Restricted to items with a coordinate (P625) and either a single point in
time (P585) or a start/end time range (P580/P582), typed -- directly or via
one subclass hop -- as one of a fixed allow-list of historical-event
classes (see `EVENT_CLASSES`). This is a deliberate precision/recall
tradeoff: an explicit allow-list keeps out generic "occurrence" noise
(award ceremonies, conferences, sports matches) at the cost of missing
events typed under classes not on the list.

Returns raw SPARQL JSON result bindings -- `transform.py` is responsible
for normalizing (and defensively handling malformed/partial) rows. Note
that the date filters in these queries are intentionally loose (see
`build_point_in_time_query`/`build_range_query` docstrings) -- callers
(`ingestion/ingest_wikidata.py`) re-check exact date-window overlap in
Python after transforming, rather than relying solely on WDQS-side FILTERs.

Uses `requests`, not `httpx`: verified empirically that Wikimedia's edge
returns 403 ("Please respect our robot policy") for httpx requests with a
compliant User-Agent, while an identical request made with `requests`
succeeds -- consistent with edge-level TLS/connection fingerprinting that
happens to catch httpx's client signature. Reproduced against both this
endpoint and Wikipedia's REST API (see `wikipedia_client.py`).
"""

from __future__ import annotations

import time
from datetime import date, timedelta
from typing import Any

import requests

from ingestion.http_utils import request_with_retry

WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# Pause between the point-in-time and range queries within one `fetch_events`
# call, so a single date-range request never fires two back-to-back hits at
# WDQS.
_INTER_QUERY_DELAY_SECONDS = 1.0

# Wikidata's User-Agent policy (https://meta.wikimedia.org/wiki/User-Agent_policy)
# aggressively rate-limits or blocks generic/unidentified clients.
USER_AGENT = (
    "eras-history-map-ingestion/0.1 "
    "(offline batch ingestion for a personal history-map project; contact via GitHub issues)"
)

# Allow-list of event classes, matched via `wdt:P31/wdt:P279?` (instance of,
# optionally one subclass hop) in the query builders below.
EVENT_CLASSES: dict[str, str] = {
    "Q178561": "battle",
    "Q188055": "siege",
    "Q2001676": "military offensive",
    "Q131569": "treaty",
    "Q13418847": "historical event",
    "Q10931": "revolution",
    "Q45382": "coup d'état",
    "Q3882219": "assassination",
}

_RESULT_LIMIT = 500

# How far before the requested window's start a P580 (start time) is still
# allowed to fall, in `build_range_query`. Without *some* lower bound, the
# query matches any event that merely started before the window closes --
# which, across all of recorded history, is an enormous, unordered set;
# WDQS has no implicit relevance ranking, so `_RESULT_LIMIT` can fill up
# with ancient noise before reaching the events the window actually wants
# (observed directly: a real Waterloo-week battle dropped out of the top
# 500 rows once this bound was missing). 90 days comfortably covers
# multi-month sieges/campaigns while keeping the candidate set small enough
# to stay fast.
_MAX_EVENT_SPAN_DAYS = 90

_PREFIXES = """
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX schema: <http://schema.org/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

# Enrichment shared by both query builders: a linked place (P276) and
# English Wikipedia sitelink, resolved via labels in one SERVICE call.
# Plain (non-f) string spliced into the f-strings below via `{_ENRICHMENT}`
# -- single braces here, since it isn't itself re-processed as an f-string.
_ENRICHMENT = """
  OPTIONAL { ?item wdt:P276 ?place . }
  OPTIONAL {
    ?articleUrl schema:about ?item ;
                schema:isPartOf <https://en.wikipedia.org/> ;
                schema:name ?articleTitle .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
"""


def _class_values() -> str:
    return " ".join(f"wd:{qid}" for qid in EVENT_CLASSES)


def build_point_in_time_query(start_date: str, end_date: str) -> str:
    """Builds the SPARQL query for events with a single P585 point in time
    within `start_date`..`end_date` (inclusive, ISO 8601 `YYYY-MM-DD`
    strings). The class/coordinate triples are placed *before* the P585
    triple deliberately -- WDQS's query planner handles this join order far
    better than the reverse for this allow-list (empirically: ~10-15s vs.
    30s+ timeouts), since it lets the (comparatively small) class-matching
    set narrow things down before touching the much larger P585 index."""
    return f"""{_PREFIXES}
SELECT ?item ?itemLabel ?itemDescription ?coord ?pointInTime
       ?place ?placeLabel ?articleTitle WHERE {{
  VALUES ?class {{ {_class_values()} }}
  ?item wdt:P31/wdt:P279? ?class .
  ?item wdt:P625 ?coord .
  ?item wdt:P585 ?pointInTime .
  FILTER(?pointInTime >= "{start_date}T00:00:00Z"^^xsd:dateTime
    && ?pointInTime <= "{end_date}T23:59:59Z"^^xsd:dateTime)
{_ENRICHMENT}}}
LIMIT {_RESULT_LIMIT}
"""


def build_range_query(start_date: str, end_date: str) -> str:
    """Builds the SPARQL query for events with a P580 start time (optionally
    P582 end time) overlapping `start_date`..`end_date`.

    Uses two cheap FILTERs on `?startTime` alone (`<= end_date` and
    `>= start_date - _MAX_EVENT_SPAN_DAYS`) rather than the full, precise
    overlap condition (which also needs a BOUND() check for a possibly
    missing P582) -- an equivalent-looking FILTER combining a second
    property comparison and BOUND() reproducibly pushed WDQS well past any
    reasonable timeout in testing against this class list, seemingly due to
    how its query planner handles the extra boolean complexity, not a cost
    inherent to the extra data. This still intentionally over-fetches
    somewhat (an unbound end time is *not* "still ongoing" for a historical
    event the way it can be for e.g. a person's tenure); `ingest_wikidata.py`
    re-checks exact overlap in Python after transforming, where date
    comparison is cheap."""
    lower_bound = date.fromisoformat(start_date) - timedelta(days=_MAX_EVENT_SPAN_DAYS)
    return f"""{_PREFIXES}
SELECT ?item ?itemLabel ?itemDescription ?coord ?startTime ?endTime
       ?place ?placeLabel ?articleTitle WHERE {{
  VALUES ?class {{ {_class_values()} }}
  ?item wdt:P31/wdt:P279? ?class .
  ?item wdt:P625 ?coord .
  ?item wdt:P580 ?startTime .
  FILTER(?startTime <= "{end_date}T23:59:59Z"^^xsd:dateTime
    && ?startTime >= "{lower_bound.isoformat()}T00:00:00Z"^^xsd:dateTime)
  OPTIONAL {{ ?item wdt:P582 ?endTime . }}
{_ENRICHMENT}}}
LIMIT {_RESULT_LIMIT}
"""


def _run_query(query: str, *, timeout: float) -> list[dict[str, Any]]:
    response = request_with_retry(
        lambda: requests.get(
            WIKIDATA_SPARQL_ENDPOINT,
            params={"query": query, "format": "json"},
            headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
            timeout=timeout,
        )
    )
    try:
        data = response.json()
    except ValueError:
        return []
    if not isinstance(data, dict):
        return []
    bindings = data.get("results", {}).get("bindings")
    return bindings if isinstance(bindings, list) else []


def fetch_events(start_date: str, end_date: str, *, timeout: float = 60.0) -> list[dict[str, Any]]:
    """Runs both the point-in-time and start/end-time queries against WDQS
    and returns their combined, deduplicated (by item URI) raw
    `results.bindings`. When an item appears in both result sets (has both
    P585 and P580 set, which is unusual but possible), the point-in-time
    binding wins, since P585 is the more precise signal."""
    point_bindings = _run_query(build_point_in_time_query(start_date, end_date), timeout=timeout)
    time.sleep(_INTER_QUERY_DELAY_SECONDS)
    range_bindings = _run_query(build_range_query(start_date, end_date), timeout=timeout)

    by_item: dict[str, dict[str, Any]] = {}
    for binding in range_bindings:
        item = binding.get("item", {}).get("value")
        if item:
            by_item[item] = binding
    for binding in point_bindings:
        item = binding.get("item", {}).get("value")
        if item:
            by_item[item] = binding  # point-in-time overrides a range binding for the same item

    return list(by_item.values())
