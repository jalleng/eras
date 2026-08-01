"""CLI entrypoint: pulls historical events from Wikidata for a date range,
enriches them with Wikipedia summaries, and writes them into the same Aura
instance as the curated (Phase 2) dataset -- as unverified, wikidata-sourced
records, never mixed into or overwriting curated data.

Idempotent: Event nodes are MERGEd on `wikidata_id`, so re-running the same
date range updates rather than duplicates.

Usage:
    uv run python -m ingestion.ingest_wikidata \\
        --start-date 1815-06-15 --end-date 1815-06-22 --dry-run
    uv run python -m ingestion.ingest_wikidata --start-date 1815-06-15 --end-date 1815-06-22
"""

from __future__ import annotations

import argparse
import time
from datetime import date, timedelta

import requests
from neo4j import ManagedTransaction, Session

from app.db.neo4j_driver import close_driver, get_driver
from ingestion import transform, wikidata_client, wikipedia_client
from ingestion.transform import TransformedEvent, TransformedLocation

# Events within this many days of each other (and at different locations)
# get an inferred CONCURRENT_WITH link. Deliberately loose: unlike curated
# clusters, these pairs aren't meant to imply a real connection -- just a
# "meanwhile, elsewhere in the world" sense of rough simultaneity. See the
# ingestion proposal discussion for why 7 days (vs. a tighter window) was
# chosen.
CONCURRENCY_WINDOW_DAYS = 7

# Pause between successive per-event Wikipedia summary fetches, so a batch
# with many linked articles doesn't hammer the REST API in a tight loop.
_WIKIPEDIA_REQUEST_DELAY_SECONDS = 0.2


def _overlaps_window(event: TransformedEvent, start_date: date, end_date: date) -> bool:
    """Exact date-window overlap check, re-verified in Python rather than
    trusted to WDQS's FILTER alone. `wikidata_client.build_range_query` uses
    an intentionally loose server-side filter (see its docstring) that can
    over-fetch items with a start time far outside the requested window when
    no end time is recorded -- this is what actually enforces the window."""
    event_end = event.date_end or event.date_start
    return event.date_start <= end_date and event_end >= start_date


def _fetch_and_transform(start_date: date, end_date: date) -> list[TransformedEvent]:
    try:
        bindings = wikidata_client.fetch_events(start_date.isoformat(), end_date.isoformat())
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Wikidata Query Service request failed even after retries: {exc}"
        ) from exc

    events: list[TransformedEvent] = []
    skipped = 0
    out_of_window = 0
    for binding in bindings:
        title = transform.get_wikipedia_title(binding)
        summary = wikipedia_client.fetch_summary(title) if title else None
        if title:
            # Be a good citizen of Wikipedia's REST API: a batch can link to
            # hundreds of articles, so throttle even the successful calls
            # rather than relying solely on retry backoff for failures.
            time.sleep(_WIKIPEDIA_REQUEST_DELAY_SECONDS)
        event = transform.transform_binding(binding, summary)
        if event is None:
            skipped += 1
            continue
        if not _overlaps_window(event, start_date, end_date):
            out_of_window += 1
            continue
        events.append(event)

    print(
        f"Fetched {len(bindings)} raw Wikidata result(s), transformed {len(events)} "
        f"usable event(s) ({skipped} skipped: missing a usable coordinate/date; "
        f"{out_of_window} skipped: outside the requested date window)."
    )
    return events


def _event_span_end(event: TransformedEvent) -> date:
    return event.date_end or event.date_start


def _range_gap_days(a: TransformedEvent, b: TransformedEvent) -> int:
    """Days between two events' date spans; 0 if they overlap."""
    a_end, b_end = _event_span_end(a), _event_span_end(b)
    if a_end < b.date_start:
        return (b.date_start - a_end).days
    if b_end < a.date_start:
        return (a.date_start - b_end).days
    return 0


def infer_concurrent_pairs(
    events: list[TransformedEvent], *, window_days: int = CONCURRENCY_WINDOW_DAYS
) -> list[tuple[str, str]]:
    """Returns `(wikidata_id, wikidata_id)` pairs for events whose date
    spans fall within `window_days` of each other and occur at different
    locations."""
    pairs: list[tuple[str, str]] = []
    for i, event_a in enumerate(events):
        for event_b in events[i + 1 :]:
            if event_a.location.id == event_b.location.id:
                continue
            if _range_gap_days(event_a, event_b) <= window_days:
                pairs.append((event_a.wikidata_id, event_b.wikidata_id))
    return pairs


def _print_preview(events: list[TransformedEvent], pairs: list[tuple[str, str]]) -> None:
    regions = sorted({event.location.region for event in events})
    locations = {event.location.id for event in events}
    with_wikipedia = sum(1 for event in events if event.wikipedia_url is not None)
    with_range = sum(1 for event in events if event.date_end is not None)

    print(f"  regions: {regions}")
    print(f"  unique locations: {len(locations)}")
    print(f"  events with a linked Wikipedia article: {with_wikipedia}/{len(events)}")
    print(f"  events with a date range (not single-day): {with_range}/{len(events)}")
    print(f"  inferred CONCURRENT_WITH pairs (window={CONCURRENCY_WINDOW_DAYS}d): {len(pairs)}")

    print("\nSample events:")
    for event in sorted(events, key=lambda e: e.date_start)[:10]:
        span = event.date_start.isoformat()
        if event.date_end:
            span += f" .. {event.date_end.isoformat()}"
        wiki = event.wikipedia_url or "(no Wikipedia article)"
        print(f"  [{event.wikidata_id}] {event.title} — {span} — {event.location.name} — {wiki}")


def _seed_region_tx(tx: ManagedTransaction, name: str, region_id: str) -> None:
    tx.run(
        "MERGE (r:Region {name: $name}) ON CREATE SET r.id = $region_id",
        name=name,
        region_id=region_id,
    )


def _seed_location_tx(tx: ManagedTransaction, location: TransformedLocation) -> None:
    tx.run(
        """
        MATCH (r:Region {name: $region})
        MERGE (l:Location {id: $location_id})
        SET l.name = $name, l.latitude = $latitude, l.longitude = $longitude
        MERGE (l)-[:IN_REGION]->(r)
        """,
        location_id=location.id,
        name=location.name,
        latitude=location.latitude,
        longitude=location.longitude,
        region=location.region,
    )


def _seed_event_tx(tx: ManagedTransaction, event: TransformedEvent) -> None:
    tx.run(
        """
        MATCH (l:Location {id: $location_id})
        MERGE (e:Event {wikidata_id: $wikidata_id})
        SET e.id = $id, e.title = $title, e.description = $description,
            e.date_start = date($date_start),
            e.date_end = CASE WHEN $date_end IS NULL THEN NULL ELSE date($date_end) END,
            e.latitude = $latitude, e.longitude = $longitude,
            e.wikipedia_url = $wikipedia_url, e.source = $source, e.verified = $verified
        MERGE (e)-[:OCCURRED_AT]->(l)
        """,
        wikidata_id=event.wikidata_id,
        id=event.id,
        title=event.title,
        description=event.description,
        date_start=event.date_start.isoformat(),
        date_end=event.date_end.isoformat() if event.date_end else None,
        latitude=event.latitude,
        longitude=event.longitude,
        wikipedia_url=event.wikipedia_url,
        source=event.source,
        verified=event.verified,
        location_id=event.location.id,
    )


def _seed_inferred_concurrent_tx(
    tx: ManagedTransaction, wikidata_id_a: str, wikidata_id_b: str
) -> None:
    tx.run(
        """
        MATCH (a:Event {wikidata_id: $wikidata_id_a}), (b:Event {wikidata_id: $wikidata_id_b})
        MERGE (a)-[rel:CONCURRENT_WITH]-(b)
        SET rel.source = 'inferred'
        """,
        wikidata_id_a=wikidata_id_a,
        wikidata_id_b=wikidata_id_b,
    )


def _slugify_region_name(name: str) -> str:
    return name.lower().replace(" ", "-")


def write_to_neo4j(
    session: Session, events: list[TransformedEvent], pairs: list[tuple[str, str]]
) -> None:
    region_names = sorted({event.location.region for event in events})
    for name in region_names:
        session.execute_write(_seed_region_tx, name, _slugify_region_name(name))

    locations = {event.location.id: event.location for event in events}
    for location in locations.values():
        session.execute_write(_seed_location_tx, location)

    for event in events:
        session.execute_write(_seed_event_tx, event)

    for wikidata_id_a, wikidata_id_b in pairs:
        session.execute_write(_seed_inferred_concurrent_tx, wikidata_id_a, wikidata_id_b)


def run(start_date: date, end_date: date, *, dry_run: bool) -> None:
    events = _fetch_and_transform(start_date, end_date)
    pairs = infer_concurrent_pairs(events)
    _print_preview(events, pairs)

    if dry_run:
        print("\nDRY RUN -- nothing written to Neo4j.")
        return

    driver = get_driver()
    with driver.session() as session:
        write_to_neo4j(session, events, pairs)
    close_driver()

    location_count = len({event.location.id for event in events})
    print(
        f"\nWrote {len(events)} event(s), {location_count} location(s), and {len(pairs)} "
        "inferred CONCURRENT_WITH relationship(s) to Neo4j."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest historical events from Wikidata into Neo4j."
    )
    parser.add_argument("--start-date", required=True, type=date.fromisoformat)
    parser.add_argument("--end-date", required=True, type=date.fromisoformat)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be written without committing anything to Neo4j.",
    )
    args = parser.parse_args()

    if args.end_date < args.start_date:
        parser.error("--end-date must not be before --start-date")
    if args.end_date - args.start_date > timedelta(days=31):
        parser.error(
            "date range exceeds 31 days -- this pipeline is scoped for small, "
            "validating pulls, not broad backfills"
        )

    run(args.start_date, args.end_date, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
