"""Normalizes raw Wikidata SPARQL bindings (+ optional Wikipedia enrichment)
into this project's Event/Location/Region graph shape.

Every event this module produces gets `source="wikidata"` and
`verified=False` -- curated (Phase 2) events are hand-authored elsewhere
(`curated_events.py`) and untouched by this pipeline. Field names mirror
`app/models/event.py` and `ingestion/seed.py`'s graph shape (not a literal
import of the pydantic API models -- `curated_events.py` follows the same
plain-dataclass precedent for ingestion-time data).

`transform_binding` is defensive by design: a SPARQL result row missing an
item URI, a parseable coordinate, or a usable date is skipped (returns
None) rather than raising, so one malformed/partial row doesn't abort a
whole ingestion batch.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Any

from ingestion.wikipedia_client import WikipediaSummary

WIKIDATA_ENTITY_PREFIX = "http://www.wikidata.org/entity/"

_POINT_RE = re.compile(r"^Point\(([-\d.]+)\s+([-\d.]+)\)$")

_EVENT_NAME_PREFIX_RE = re.compile(
    r"^(Battle of|Battle at|Siege of|Siege at|Treaty of)\s+", re.IGNORECASE
)

_SLUG_RE = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class TransformedLocation:
    id: str
    name: str
    latitude: float
    longitude: float
    region: str


@dataclass(frozen=True)
class TransformedEvent:
    wikidata_id: str
    id: str
    title: str
    description: str
    date_start: date
    date_end: date | None
    latitude: float
    longitude: float
    wikipedia_url: str | None
    source: str
    verified: bool
    location: TransformedLocation


def get_wikipedia_title(binding: dict[str, Any]) -> str | None:
    """Returns the linked English Wikipedia article title for a raw SPARQL
    binding, or None if the item has no such sitelink. Callers use this to
    decide whether to fetch a `WikipediaSummary` before transforming."""
    return _binding_value(binding, "articleTitle")


def transform_binding(
    binding: dict[str, Any],
    wikipedia_summary: WikipediaSummary | None = None,
) -> TransformedEvent | None:
    """Normalizes one SPARQL result row (+ its already-fetched Wikipedia
    summary, if any) into a `TransformedEvent`. Returns None if the row is
    missing something this pipeline requires: an item URI, a parseable
    P625 coordinate, or a usable P585/P580 date."""
    qid = _extract_qid(binding)
    if qid is None:
        return None

    coordinates = _extract_coordinates(binding)
    if coordinates is None:
        return None
    latitude, longitude = coordinates

    date_start, date_end = _extract_dates(binding)
    if date_start is None:
        return None

    label = _binding_value(binding, "itemLabel") or qid
    if wikipedia_summary is not None:
        description = wikipedia_summary.extract
        wikipedia_url = wikipedia_summary.url
    else:
        description = _binding_value(binding, "itemDescription") or ""
        wikipedia_url = None

    location_name = _binding_value(binding, "placeLabel") or _strip_event_name_prefix(label)
    region = continent_from_coordinates(latitude, longitude)
    location = TransformedLocation(
        id=f"wikidata-loc-{_slugify(location_name)}",
        name=location_name,
        latitude=latitude,
        longitude=longitude,
        region=region,
    )

    return TransformedEvent(
        wikidata_id=qid,
        id=f"wikidata-{qid}",
        title=label,
        description=description,
        date_start=date_start,
        date_end=date_end,
        latitude=latitude,
        longitude=longitude,
        wikipedia_url=wikipedia_url,
        source="wikidata",
        verified=False,
        location=location,
    )


def continent_from_coordinates(latitude: float, longitude: float) -> str:
    """Coarse continent classification from a lat/lon bounding box -- not
    real reverse geocoding, just enough to slot an ingested event's
    Location into one of the same seven Region groupings the curated
    dataset and frontend already use (North America, South America, Europe,
    Africa, Asia, Oceania, Antarctica). Boundaries are approximate and can
    misclassify points near continental borders/coastlines; acceptable for
    this pipeline's first, validating pass over a single well-known
    European campaign, but worth swapping for a real reverse-geocoding
    lookup before ingesting broader, border-heavy ranges."""
    if latitude < -60:
        return "Antarctica"
    if latitude >= 34 and -25 <= longitude <= 60:
        return "Europe"
    if -35 <= latitude < 34 and -20 <= longitude <= 52:
        return "Africa"
    if -50 <= latitude <= 0 and (110 <= longitude <= 180 or -180 <= longitude <= -130):
        return "Oceania"
    if 5 <= latitude <= 83 and -170 <= longitude <= -50:
        return "North America"
    if -56 <= latitude <= 13 and -82 <= longitude <= -34:
        return "South America"
    return "Asia"


def _extract_qid(binding: dict[str, Any]) -> str | None:
    uri = _binding_value(binding, "item")
    if uri is None or not uri.startswith(WIKIDATA_ENTITY_PREFIX):
        return None
    qid = uri[len(WIKIDATA_ENTITY_PREFIX) :]
    return qid or None


def _extract_coordinates(binding: dict[str, Any]) -> tuple[float, float] | None:
    coord = _binding_value(binding, "coord")
    if coord is None:
        return None
    match = _POINT_RE.match(coord)
    if match is None:
        return None
    try:
        longitude, latitude = float(match.group(1)), float(match.group(2))
    except ValueError:
        return None
    return latitude, longitude


def _extract_dates(binding: dict[str, Any]) -> tuple[date | None, date | None]:
    point_in_time = _binding_date(binding, "pointInTime")
    if point_in_time is not None:
        return point_in_time, None
    start_time = _binding_date(binding, "startTime")
    if start_time is not None:
        return start_time, _binding_date(binding, "endTime")
    return None, None


def _binding_date(binding: dict[str, Any], key: str) -> date | None:
    value = _binding_value(binding, key)
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _binding_value(binding: dict[str, Any], key: str) -> str | None:
    entry = binding.get(key)
    if not isinstance(entry, dict):
        return None
    value = entry.get("value")
    return value if isinstance(value, str) and value else None


def _strip_event_name_prefix(label: str) -> str:
    stripped = _EVENT_NAME_PREFIX_RE.sub("", label).strip()
    return stripped or label


def _slugify(name: str) -> str:
    return _SLUG_RE.sub("-", name.lower()).strip("-")
