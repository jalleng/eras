# Eras — Historical Events Map

Explore what was happening around the world at a given moment in history:
pick a date, see events plotted on a world map, and discover what else was
unfolding elsewhere at the same time.

This is **Phase 1**: a polished frontend demo running entirely against a
small curated dataset, with no real backend. The data layer is architected
so that swapping the curated data for a real API in Phase 2 (FastAPI +
Neo4j) requires no component changes — see [Architecture](#architecture)
below.

## Tech stack

- Vite + React 18 + TypeScript (strict mode)
- D3.js v7 for the map projection, path generation, and zoom/pan/rotate
  behavior
- Tailwind CSS for styling
- Vitest + React Testing Library for tests
- ESLint + Prettier

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm test          # run the test suite
npm run build     # type-check and build for production
npm run lint      # lint
npm run format    # format with Prettier
```

## Scope and limitations (Phase 1)

- **Curated dataset only.** Three dates are included: July 4, 1776
  (Declaration of Independence); December 7–8, 1941 (the near-simultaneous
  opening attacks of the Pacific War); and October 27, 1962 ("Black
  Saturday" of the Cuban Missile Crisis, coinciding with the Sino-Indian
  War). Every event's date/location was checked against multiple sources;
  see the comments in `src/data/curatedDates.ts` for the one deliberate
  exception (Captain Cook's departure, included 8 days after July 4 because
  same-day non-U.S. events that day are thin in the historical record).
- **No backend.** `api/events.ts` and `api/polities.ts` are written as if
  they called a real API but currently just read `data/curatedDates.ts`
  synchronously (wrapped in a resolved Promise). Phase 2 replaces their
  internals only.
- **No polity/boundary data yet.** `BoundaryLayer` renders nothing today —
  it's wired to accept boundary GeoJSON as a prop and is a deliberate no-op
  until Phase 5 populates real data.
- **Land geometry**: [`world-atlas`](https://github.com/topojson/world-atlas)'s
  `land-110m.json` (110m resolution, via `topojson-client`), chosen because
  it's the standard lightweight package for D3 world maps and needs no
  network fetch — it's bundled at build time.
- **State management**: a small React Context + `useReducer` store
  (`state/mapStore.ts`), rather than a separate library, since the shared
  state (selected date, hover/selection, projection mode) is simple enough
  not to need one.
- **Zoom/pan sensitivity and marker styling** are reasonable defaults for a
  demo, not exhaustively tuned.

## Architecture

```
api/            "as if real" API functions, typed per api/types.ts,
                 reading from data/curatedDates.ts today
hooks/           useEventsForDate / useBoundariesForYear call the api/
                 layer; components only ever see this hook interface
data/            the curated dataset itself
components/      map (D3 rendering), timeline (date slider),
                 event-detail (tooltip/panel/list), layout
state/           app-wide selection state (Context + useReducer)
utils/           pure helpers: dateUtils, geo, colorScale
```

Phase 2 replaces the bodies of `api/events.ts` and `api/polities.ts` with
real `fetch` calls (`api/client.ts` already has the seam for this via
`VITE_API_BASE_URL`); no hook, component, or state code needs to change.

## Accessibility

- The date slider is a native `<input type="range">` — keyboard-operable
  (arrow keys, Home/End, Page Up/Down) with an `aria-valuetext` announcing
  the human-readable date.
- Event markers are focusable (`tabIndex`, `role="button"`,
  `aria-label`), respond to Enter/Space, and show a hover/focus ring —
  keyboard users aren't limited to mouse-only interaction, though the
  mouse-hover polish (tooltip, connecting lines) is the primary experience.
