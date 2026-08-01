import type { FeaturedRange } from '../api/types'

/**
 * Quick-jump presets for the range slider: hand-picked windows known to have
 * interesting, well-populated data, offered as a shortcut past the "drag
 * around and hope you land somewhere with events" cold start. This is a
 * frontend/UX concern (which windows to feature), not domain data — the
 * events themselves live in the Phase 2 backend (Neo4j) and are fetched
 * live via `getEventsForRange`, so nothing is duplicated here.
 */
export const featuredRanges: FeaturedRange[] = [
  {
    rangeStart: '1776-06-28',
    rangeEnd: '1776-07-12',
    label: 'Declaration of Independence',
  },
  {
    rangeStart: '1815-06-15',
    rangeEnd: '1815-06-22',
    label: 'Battle of Waterloo',
  },
  {
    rangeStart: '1941-12-07',
    rangeEnd: '1941-12-08',
    label: 'Opening of the Pacific War',
  },
  {
    rangeStart: '1962-10-27',
    rangeEnd: '1962-10-27',
    label: 'Black Saturday: two Cold War crises collide',
  },
]
