export const CATEGORIES = [
  'uncategorized', 'study', 'food', 'travel', 'work', 'meetup', 'errands', 'personal',
]

export function catClass(category) {
  return `cat-${(category || 'uncategorized').toLowerCase().replace(/\s+/g, '-')}`
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCoord(n) {
  return Number(n).toFixed(5)
}

// ── Distance Calculations ─────────────────────────────────────────────────
// 
// Design: Haversine formula for great-circle distance (simplified geodetic).
// Why: Accurate enough for user-facing distance estimates (~100km range).
//      Simpler than Vincenty, no external dependencies, O(1) time.
// References: https://en.wikipedia.org/wiki/Haversine_formula

/** Haversine great-circle distance in kilometres */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Format km — shows metres below 1 km */
export function formatDist(km) {
  if (km == null) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(2)} km`
  return `${km.toFixed(1)} km`
}

/** Build full N×N distance matrix from an array of places */
export function buildMatrix(places) {
  return places.map(a =>
    places.map(b => (a.id === b.id ? 0 : haversine(a.lat, a.lng, b.lat, b.lng)))
  )
}

// ── Create a custom SVG pin for Leaflet ──────────────────────────────────
export function makePinIcon(category, active = false) {
  const colors = {
    study:         '#4f8cff',
    food:          '#f0a500',
    travel:        '#00d4aa',
    work:          '#9664ff',
    meetup:        '#ff7850',
    errands:       '#8b949e',
    personal:      '#ff4d6d',
    uncategorized: '#484f58',
  }
  const fill = colors[category] || colors.uncategorized
  const size = active ? 36 : 28
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
      <circle cx="14" cy="11" r="9" fill="${fill}" opacity="0.18"/>
      <circle cx="14" cy="11" r="5.5" fill="${fill}"/>
      <line x1="14" y1="16.5" x2="14" y2="26" stroke="${fill}" stroke-width="2" stroke-linecap="round"/>
      ${active ? `<circle cx="14" cy="11" r="8" fill="none" stroke="${fill}" stroke-width="1.5" opacity="0.5"/>` : ''}
    </svg>
  `
  // dynamic import for Leaflet to avoid SSR issues
  return { svg, size, fill }
}
