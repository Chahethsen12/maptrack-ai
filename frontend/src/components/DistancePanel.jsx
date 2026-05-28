import { useState } from 'react'
import { haversine, formatDist, buildMatrix } from '../utils'

// Colour-code distance cells
function distColor(km) {
  if (km === 0)   return 'transparent'
  if (km < 1)     return 'rgba(0,212,170,0.18)'   // teal — very close
  if (km < 10)    return 'rgba(79,140,255,0.15)'   // blue — nearby
  if (km < 50)    return 'rgba(240,165,0,0.15)'    // amber — moderate
  return           'rgba(255,77,109,0.12)'          // red — far
}

function DistCell({ km }) {
  return (
    <td style={{
      padding: '5px 8px',
      textAlign: 'right',
      fontFamily: 'var(--mono)',
      fontSize: 11,
      background: distColor(km),
      color: km === 0 ? 'var(--text-faint)' : 'var(--text)',
      borderBottom: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      whiteSpace: 'nowrap',
    }}>
      {km === 0 ? '—' : formatDist(km)}
    </td>
  )
}

function FromLocationList({ places, userLoc }) {
  const sorted = [...places]
    .map(p => ({ ...p, dist: haversine(userLoc.lat, userLoc.lng, p.lat, p.lng) }))
    .sort((a, b) => a.dist - b.dist)

  return (
    <div>
      <div className="form-section-title" style={{ marginBottom: 10 }}>
        From my location · {places.length} places
      </div>
      {sorted.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          marginBottom: 4,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--text-faint)', width: 18, textAlign: 'right',
            }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.category}</div>
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 12,
            color: 'var(--teal)', fontWeight: 600,
            background: 'var(--teal-glow)',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {formatDist(p.dist)}
          </span>
        </div>
      ))}
    </div>
  )
}

function DistanceMatrix({ places }) {
  const matrix = buildMatrix(places)
  const labels = places.map(p =>
    p.title.length > 12 ? p.title.slice(0, 11) + '…' : p.title
  )

  return (
    <div>
      <div className="form-section-title" style={{ marginBottom: 10 }}>
        Distance matrix · {places.length}×{places.length}
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
          <thead>
            <tr>
              <th style={{
                padding: '6px 8px', background: 'var(--surface2)',
                borderBottom: '1px solid var(--border2)',
                borderRight: '1px solid var(--border2)',
                color: 'var(--text-faint)', fontSize: 10, fontWeight: 600,
                position: 'sticky', left: 0, zIndex: 1,
              }}>↓ from \ to →</th>
              {labels.map((l, i) => (
                <th key={i} style={{
                  padding: '6px 8px', background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border2)',
                  borderRight: '1px solid var(--border)',
                  color: 'var(--text-muted)', fontFamily: 'var(--mono)',
                  fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td style={{
                  padding: '5px 8px', background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  borderRight: '1px solid var(--border2)',
                  color: 'var(--text-muted)', fontFamily: 'var(--mono)',
                  fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                  position: 'sticky', left: 0,
                }}>{labels[i]}</td>
                {row.map((km, j) => <DistCell key={j} km={km} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(0,212,170,0.3)', label: '< 1 km' },
          { color: 'rgba(79,140,255,0.25)', label: '1–10 km' },
          { color: 'rgba(240,165,0,0.25)', label: '10–50 km' },
          { color: 'rgba(255,77,109,0.2)', label: '> 50 km' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-faint)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DistancePanel({ places, userLoc, onGetLocation, locating, onExportPDF, exporting }) {
  const [view, setView] = useState('from') // 'from' | 'matrix'

  if (places.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📐</div>
        <div className="empty-title">No places to measure</div>
        <div className="empty-sub">Save some places first, then come back here.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Export PDF button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 14 }}
        onClick={onExportPDF}
        disabled={exporting}
      >
        {exporting ? <><span className="spinner" /> Generating PDF…</> : '⬇ Export Full PDF Report'}
      </button>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14,
        background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 3,
      }}>
        {[
          { key: 'from', label: '◉ From My Location' },
          { key: 'matrix', label: '⊞ Distance Matrix' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              flex: 1, padding: '6px 8px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: view === key ? 'var(--surface2)' : 'transparent',
              color: view === key ? 'var(--teal)' : 'var(--text-muted)',
              fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* My location required banner */}
      {!userLoc && (
        <div style={{
          background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          marginBottom: 12, fontSize: 12, color: 'var(--amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <span>📍 Location needed for distance calculations</span>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={onGetLocation} disabled={locating}>
            {locating ? <span className="spinner" /> : 'Get location'}
          </button>
        </div>
      )}

      {view === 'from' ? (
        userLoc
          ? <FromLocationList places={places} userLoc={userLoc} />
          : <div className="empty-state">
              <div className="empty-icon">🧭</div>
              <div className="empty-title">Location not set</div>
              <div className="empty-sub">Click "Get location" above to enable distance-from-me calculations.</div>
            </div>
      ) : (
        <DistanceMatrix places={places} />
      )}
    </div>
  )
}
