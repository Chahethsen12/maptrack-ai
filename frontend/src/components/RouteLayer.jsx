import { Polyline, Tooltip } from 'react-leaflet'

/**
 * Renders saved routes (filtered to only visible ones) and the live
 * builder preview route on the Leaflet map.
 *
 * Props:
 *   savedRoutes   – full array of saved route objects from the DB
 *   visibleRoutes – array of route IDs currently toggled on
 *   builderRoute  – { geometry: [[lat,lng],...], distance, duration } | null
 */
export default function RouteLayer({ savedRoutes, visibleRoutes, builderRoute }) {
  return (
    <>
      {/* ── Saved routes toggled visible ───────────────────────── */}
      {savedRoutes
        .filter(r => visibleRoutes.includes(r.id))
        .map(r => {
          let coords
          try { coords = JSON.parse(r.geometry) } catch { return null }
          return (
            <Polyline
              key={r.id}
              positions={coords}
              pathOptions={{ color: r.color, weight: 4, opacity: 0.85 }}
            >
              <Tooltip sticky>{r.name}</Tooltip>
            </Polyline>
          )
        })}

      {/* ── Builder / unsaved route preview ────────────────────── */}
      {builderRoute?.geometry && (
        <Polyline
          positions={builderRoute.geometry}
          pathOptions={{
            color: '#00d4aa',
            weight: 4,
            opacity: 0.9,
            dashArray: '8 6',
          }}
        />
      )}
    </>
  )
}