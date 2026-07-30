import { scaleOrdinal } from 'd3-scale'
import type { Region } from '../api/types'

const REGION_ORDER: Region[] = [
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Oceania',
  'Antarctica',
]

// Categorical palette chosen for contrast against the map's neutral land/ocean
// tones and against each other; colorblind-safe (Okabe-Ito derived).
const REGION_COLORS = [
  '#E69F00',
  '#56B4E9',
  '#009E73',
  '#D55E00',
  '#CC79A7',
  '#0072B2',
  '#999999',
]

const regionColorScale = scaleOrdinal<Region, string>()
  .domain(REGION_ORDER)
  .range(REGION_COLORS)

export function colorForRegion(region: Region): string {
  return regionColorScale(region)
}
