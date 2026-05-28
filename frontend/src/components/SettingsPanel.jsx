export default function SettingsPanel({ mapStyle, setMapStyle, toast }) {
  const styles = [
    { key: 'dark',  name: 'Dark',   sub: 'CartoDB',      preview: 'preview-dark'  },
    { key: 'light', name: 'Light',  sub: 'CartoDB',      preview: 'preview-light' },
    { key: 'osm',   name: 'Street', sub: 'OpenStreetMap',preview: 'preview-osm'   },
    { key: 'topo',  name: 'Topo',   sub: 'OpenTopoMap',  preview: 'preview-topo'  },
  ]

  function handleSelect(key) {
    setMapStyle(key)
    toast(`Map style: ${styles.find(s => s.key === key)?.name}`)
  }

  return (
    <div>
      {/* Map style */}
      <div className="settings-section">
        <div className="settings-section-label">Map Style</div>
        <div className="map-style-grid">
          {styles.map(s => (
            <button
              key={s.key}
              className={`map-style-card ${mapStyle === s.key ? 'active' : ''}`}
              onClick={() => handleSelect(s.key)}
            >
              <div className={`map-style-preview ${s.preview}`} />
              <div className="map-style-name">{s.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1 }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-label">About</div>
        <div className="about-card">
          <h4>MapTrack AI</h4>
          {[
            { key: 'Version',  val: '0.1.0', badge: true },
            { key: 'Stack',    val: 'React · FastAPI · SQLite' },
            { key: 'Map',      val: 'Leaflet · OpenStreetMap' },
            { key: 'Routing',  val: 'OSRM (open-source)' },
            { key: 'AI', val: 'OpenAI · Gemini · Groq fallback' },
          ].map(({ key, val, badge }) => (
            <div className="about-row" key={key}>
              <span className="about-key">{key}</span>
              {badge
                ? <span className="version-badge">{val}</span>
                : <span className="about-val">{val}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* OSM attribution notice */}
      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: 'rgba(0,212,170,0.04)',
        border: '1px solid rgba(0,212,170,0.1)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.6,
      }}>
        Map data © <a href="https://openstreetmap.org/copyright"
          target="_blank" rel="noreferrer"
          style={{ color: 'var(--teal)', textDecoration: 'none' }}>
          OpenStreetMap
        </a> contributors. Routing via OSRM. Tiles by CartoDB / OpenTopoMap.
      </div>
    </div>
  )
}
