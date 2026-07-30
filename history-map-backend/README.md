# Eras History Map — Backend (Phase 2)

FastAPI + Neo4j service serving curated historical event, location, and
polity data. This replaces the frontend's local curated-data file with a
real API — the frontend's `api/events.ts` / `api/types.ts` contract is
unchanged, so pointing the frontend at this API is just a base-URL change.

**Phase 2 scope only**: curated data, served from Neo4j. No
Wikidata/Wikipedia ingestion pipeline (Phase 3), no vector search or agent
(Phase 4), no real historical boundary geometry (Phase 5) — see "Deferred
to later phases" below.

## Tech stack

- Python 3.12, managed with `uv` (`pyproject.toml` + `uv.lock`)
- FastAPI + Pydantic v2 (`pydantic-settings` for config)
- Neo4j (official Python driver), hosted on Neo4j Aura
- pytest, with the `get_db()` FastAPI dependency overridable for mocked
  unit/route tests
- Ruff (lint + format)

## Setup

1. Copy `.env.example` to `.env` and fill in your Neo4j Aura connection
   details (Aura Console → your instance → Connect):
   ```
   NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=<your-aura-password>
   ALLOWED_ORIGINS=http://localhost:5173
   ```
   (`Settings` has harmless local-only defaults so the app and test suite
   never *require* a `.env` file to exist — but real values are needed for
   `uvicorn`/the ingestion scripts to reach an actual database.)
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Create the database constraints (one-time, idempotent — safe to re-run):
   ```bash
   uv run python -m scripts.create_constraints
   ```
4. Seed the curated dataset (idempotent — safe to re-run):
   ```bash
   uv run python -m ingestion.seed
   ```

## Running

```bash
uv run uvicorn app.main:app --reload
```

Endpoints:

- `GET /events?start_date=...&end_date=...`
- `GET /events/{id}`
- `GET /events/{id}/concurrent`
- `GET /locations/nearest?lat=...&lon=...`
- `GET /polities/for-location?location_id=...&date=...`
- `GET /health`

## Testing

```bash
uv run pytest
```

All unit and route tests run against a mocked Neo4j session (no live
database needed) and pass by default. One integration test seeds a small,
self-contained dataset into a real Neo4j instance, queries it end to end
through the actual Cypher, and cleans up afterward — it's skipped unless
explicitly requested:

```bash
RUN_INTEGRATION_TESTS=1 uv run pytest -m integration
```

(Requires real Aura credentials in `.env`.)

## Linting

```bash
uv run ruff check .
```

## Docker

```bash
docker build -t history-map-backend .
docker run --env-file .env -p 8000:8000 history-map-backend
```

## Graph schema

```
(:Event {id, title, description, date, latitude, longitude, source})
(:Location {id, name, latitude, longitude})
(:Person {id, name})
(:Polity {id, name})
(:Region {id, name})

(:Event)-[:OCCURRED_AT]->(:Location)
(:Event)-[:INVOLVED]->(:Person)
(:Event)-[:CONCURRENT_WITH]-(:Event)          -- undirected, precomputed at seed time
(:Location)-[:IN_REGION]->(:Region)
(:Location)-[:PART_OF {start_date, end_date}]->(:Polity)   -- date-ranged
```

Two schema decisions extend the original spec (documented here since
they're not obvious from the property lists alone):

- **Region is its own node**, not a string property on `Event`/`Location`.
  `region` is resolved via `Event -> Location -> Region` and flattened to a
  plain `region: string` in API responses, so the frontend contract is
  unaffected. Regions are get-or-created by name at seed time (no
  hand-defined region list to maintain).
- **`CONCURRENT_WITH` is cluster-label-driven, not date-window-driven.**
  Each curated event carries a `cluster` label (mirroring the frontend's
  Phase 1 `CuratedDateEntry` groupings); `seed.py` connects every pair of
  events sharing a cluster label. A fixed date-window rule can't represent
  both a 1-day-wide cluster (Pearl Harbor / Malaya / Hong Kong / Philippines
  / Guam, Dec 7–8 1941) and an 8-day-wide one (Declaration of Independence /
  Battle of Sullivan's Island / Cook's third voyage, June 28 – July 12 1776)
  without either breaking real ties or inventing false ones.

## Curated dataset

`ingestion/curated_events.py` covers the same three dates as the frontend's
Phase 1 dataset — July 4, 1776; December 7–8, 1941; October 27, 1962 — built
to the same accuracy standard: every date/location was checked against
multiple sources, and the one intentionally-approximate pairing (Cook's
voyage, included 8 days after July 4 since same-day non-U.S. events that day
are thin in the record) is flagged in a comment rather than presented as
exact.

Only one polity is modeled with real historical depth (Philadelphia:
Province of Pennsylvania → United States of America, at the Declaration),
plus a second example (Hong Kong: Qing Dynasty China → British Hong Kong) —
per Phase 2's explicit scope, this just needs to demonstrate the
date-ranged `PART_OF` relationship, not provide exhaustive polity coverage.

## Deferred to later phases

- **Phase 3**: `ingestion/wikidata_client.py`, `ingestion/wikipedia_client.py`,
  `ingestion/transform.py` — automated ingestion beyond the curated set.
- **Phase 4**: `app/services/embedding_service.py`, `app/services/rag_service.py`,
  `app/agent/`, a `chat.py` router — vector search and an agent.
- **Phase 5**: `ingestion/boundaries_loader.py` and a `geometry` field on
  `PolityResponse` — real historical boundary polygons (`BoundaryLayer` on
  the frontend already renders these as a no-op today).

This build deliberately doesn't add any of the above files or fields yet,
but the schema (`Region` as a node, `PART_OF` as date-ranged, `PolityResponse`
without a geometry field) is structured so they extend it without a
redesign.
