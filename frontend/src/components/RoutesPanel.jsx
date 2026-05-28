import { useState, useEffect } from 'react'
import { createRoute, deleteRoute, fetchOSRMRoute } from '../api'

const ROUTE_COLORS = ['#4f8cff', '#00d4aa', '#9664ff', '#f0a500', '#ff4d6d', '#ff7850']

export default function RoutesPanel({
  places, userLoc,
  savedRoutes, setSavedRoutes,          // ← now comes from App.jsx
  visibleRoutes, setVisibleRoutes,
  builderRoute, setBuilderRoute, toast,
}) {
  const [waypoints, setWaypoints]     = useState([])
  const [routeName, setRouteName]     = useState('')
  const [routeColor, setRouteColor]   = useState('#4f8cff')
  const [saving, setSaving]           = useState(false)

  // No more internal loadRoutes() — App.jsx owns the data

  async function calculateRoute() {
    if (waypoints.length < 2) { setBuilderRoute(null); return }
    try {
      const data = await fetchOSRMRoute(waypoints)
      if (data.code === 'Ok' && data.routes.length > 0) {
        const r = data.routes[0]
        setBuilderRoute({
          distance: r.distance,
          duration: r.duration,
          geometry: r.geometry.coordinates.map(c => [c[1], c[0]]),
        })
      } else {
        toast('No route found', 'error')
        setBuilderRoute(null)
      }
    } catch {
      toast('Error calculating route', 'error')
      setBuilderRoute(null)
    }
  }

  useEffect(() => { calculateRoute() }, [waypoints])

  function addWaypointLocation() {
    if (!userLoc) return toast('Current location not set', 'error')
    setWaypoints(prev => [...prev, { ...userLoc, label: 'My Location' }])
  }

  function addWaypointPlace(e) {
    const placeId = parseInt(e.target.value)
    if (!placeId) return
    const place = places.find(p => p.id === placeId)
    if (!place) return
    setWaypoints(prev => [...prev, { lat: place.lat, lng: place.lng, label: place.title }])
    e.target.value = ''
  }

  function removeWaypoint(idx) {
    setWaypoints(prev => prev.filter((_, i) => i !== idx))
  }

  function moveWaypoint(idx, dir) {
    setWaypoints(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]
      return next
    })
  }

  async function handleSaveRoute() {
    if (!routeName.trim()) return toast('Enter a route name', 'error')
    if (!builderRoute)     return toast('No active route to save', 'error')
    setSaving(true)
    try {
      const payload = {
        name:     routeName,
        distance: builderRoute.distance,
        duration: builderRoute.duration,
        color:    routeColor,
        waypoints: JSON.stringify(waypoints),
        geometry:  JSON.stringify(builderRoute.geometry),
      }
      const created = await createRoute(payload)
      setSavedRoutes(prev => [created, ...prev])
      setWaypoints([])
      setRouteName('')
      setBuilderRoute(null)
      toast('Route saved!')
    } catch {
      toast('Failed to save route', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRoute(id) {
    if (!confirm('Delete this route?')) return
    try {
      await deleteRoute(id)
      // Optimistically remove from UI
      setSavedRoutes(prev => prev.filter(r => r.id !== id))
      setVisibleRoutes(prev => prev.filter(v => v !== id))
      toast('Route deleted')
    } catch (error) {
      // Restore UI state on failure + provide actionable error
      const detail = error.response?.status === 404 ? 'Route not found (may have been deleted)' : 'Network error — check connection'
      toast(`Failed to delete route: ${detail}`, 'error')
      // Trigger refresh from backend to re-sync
      // (App will refetch routes on next tab change)
    }
  }

  function toggleRoute(route) {
    setVisibleRoutes(prev =>
      prev.includes(route.id)
        ? prev.filter(id => id !== route.id)
        : [...prev, route.id]
    )
  }

  return (
    <div>

      {/* ── Route Builder ──────────────────────────────────────── */}
      <div className="panel-header">
        <div className="panel-header-icon">🛣</div>
        <div>
          <div className="panel-title">Route Builder</div>
          <div className="panel-subtitle">Add waypoints to plot a route</div>
        </div>
      </div>

      {/* Add-waypoint controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={addWaypointLocation}>
          ◉ My Location
        </button>
        <select className="form-select" style={{ flex: 1.6 }} onChange={addWaypointPlace} defaultValue="">
          <option value="" disabled>+ Add place…</option>
          {places.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* Waypoints */}
      {waypoints.length === 0 ? (
        <div className="waypoints-empty">
          Add at least 2 waypoints to build a route
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {waypoints.map((wp, idx) => (
            <div className="waypoint-item" key={idx}>
              <span className="waypoint-index">{idx + 1}</span>
              <span className="waypoint-label">{wp.label}</span>
              <div className="waypoint-actions">
                <button className="icon-btn" disabled={idx === 0}
                  onClick={() => moveWaypoint(idx, -1)}>↑</button>
                <button className="icon-btn" disabled={idx === waypoints.length - 1}
                  onClick={() => moveWaypoint(idx, 1)}>↓</button>
                <button className="icon-btn del"
                  onClick={() => removeWaypoint(idx)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Builder route preview + save form */}
      {builderRoute && (
        <div className="route-preview-card">
          <div className="route-stats">
            <div className="route-stat">
              <span className="route-stat-label">Distance</span>
              <span className="route-stat-value">
                {(builderRoute.distance / 1000).toFixed(2)} km
              </span>
            </div>
            <div className="route-stat">
              <span className="route-stat-label">Duration</span>
              <span className="route-stat-value">
                {Math.round(builderRoute.duration / 60)} min
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Route name</label>
            <input
              className="form-input"
              placeholder="e.g. Morning commute"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker-row">
              {ROUTE_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${routeColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setRouteColor(c)}
                />
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleSaveRoute}
            disabled={saving}
          >
            {saving ? <><span className="spinner" /> Saving…</> : '⬡ Save Route'}
          </button>
        </div>
      )}

      <div className="divider" />

      {/* ── Saved Routes ───────────────────────────────────────── */}
      <div className="panel-header">
        <div className="panel-header-icon">⬡</div>
        <div>
          <div className="panel-title">Saved Routes</div>
          <div className="panel-subtitle">
            {savedRoutes.length} route{savedRoutes.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {savedRoutes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛣️</div>
          <div className="empty-title">No saved routes</div>
          <div className="empty-sub">
            Build a route above and save it to see it here.
          </div>
        </div>
      ) : (
        savedRoutes.map(route => (
          <div
            key={route.id}
            className={`route-card ${visibleRoutes.includes(route.id) ? 'active' : ''}`}
            style={{ '--route-color': route.color }}
            onClick={() => toggleRoute(route)}
          >
            <div className="route-card-left">
              <div className="route-color-dot" style={{ background: route.color }} />
              <div style={{ minWidth: 0 }}>
                <div className="route-card-name">{route.name}</div>
                <div className="route-card-meta">
                  {(route.distance / 1000).toFixed(1)} km
                  &nbsp;·&nbsp;
                  {Math.round(route.duration / 60)} min
                </div>
              </div>
            </div>
            <div className="route-card-actions">
              <div className={`route-toggle ${visibleRoutes.includes(route.id) ? 'on' : ''}`} />
              <button
                className="icon-btn del"
                title="Delete route"
                aria-label={`Delete route: ${route.name}`}
                onClick={e => { e.stopPropagation(); handleDeleteRoute(route.id) }}
              >✕</button>
            </div>
          </div>
        ))
      )}

    </div>
  )
}