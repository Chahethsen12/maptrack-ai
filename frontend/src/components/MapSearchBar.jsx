import { useState, useRef, useEffect } from 'react'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export default function MapSearchBar({ onResult }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const debounceRef             = useRef(null)
  const wrapperRef              = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  async function search(q) {
    setLoading(true)
    try {
      const res = await fetch(
        `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(item) {
    setQuery(item.display_name.split(',').slice(0, 2).join(','))
    setOpen(false)
    setResults([])
    onResult({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name,
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(420px, calc(100% - 32px))',
        zIndex: 1000,
      }}
    >
      {/* Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: open && results.length ? '8px 8px 0 0' : '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        transition: 'border-radius 0.15s',
      }}>
        <span style={{
          padding: '0 10px 0 12px',
          color: loading ? 'var(--teal)' : 'var(--text-faint)',
          fontSize: 15, flexShrink: 0,
          transition: 'color 0.2s',
        }}>
          {loading ? '⟳' : '⌕'}
        </span>
        <input
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search any location on the map…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'var(--font)',
            fontSize: 13,
            padding: '11px 0',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{
              padding: '0 12px', background: 'none', border: 'none',
              color: 'var(--text-faint)', cursor: 'pointer', fontSize: 13,
              flexShrink: 0,
            }}
          >✕</button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderTop: '1px solid var(--border)',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {results.map((item, i) => {
            const parts = item.display_name.split(', ')
            const primary   = parts.slice(0, 2).join(', ')
            const secondary = parts.slice(2).join(', ')
            const typeIcon  = typeEmoji(item.type, item.class)
            return (
              <button
                key={item.place_id}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  width: '100%',
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)',
                  fontFamily: 'var(--font)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>{typeIcon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {primary}
                  </div>
                  {secondary && (
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {secondary}
                    </div>
                  )}
                </div>
                <span style={{
                  marginLeft: 'auto', flexShrink: 0, fontSize: 10,
                  color: 'var(--text-faint)', fontFamily: 'var(--mono)',
                  paddingTop: 2,
                }}>
                  {parseFloat(item.lat).toFixed(3)}, {parseFloat(item.lon).toFixed(3)}
                </span>
              </button>
            )
          })}
          <div style={{
            padding: '5px 14px',
            fontSize: 10, color: 'var(--text-faint)',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            Powered by © OpenStreetMap / Nominatim
          </div>
        </div>
      )}
    </div>
  )
}

function typeEmoji(type, cls) {
  const map = {
    restaurant: '🍽️', cafe: '☕', bar: '🍺', fast_food: '🍔',
    hotel: '🏨', hostel: '🏨', motel: '🏨',
    university: '🎓', school: '🏫', college: '🎓',
    hospital: '🏥', pharmacy: '💊', clinic: '🏥',
    park: '🌳', forest: '🌲', beach: '🏖️', mountain: '⛰️',
    airport: '✈️', station: '🚉', bus_stop: '🚌',
    supermarket: '🛒', mall: '🏬', shop: '🛍️',
    city: '🏙️', town: '🏘️', village: '🏡',
    country: '🌍', state: '📍', county: '📍',
    museum: '🏛️', theatre: '🎭', cinema: '🎬',
    place_of_worship: '⛪', mosque: '🕌', temple: '🛕',
  }
  if (map[type]) return map[type]
  if (cls === 'highway') return '🛣️'
  if (cls === 'waterway') return '🌊'
  if (cls === 'boundary') return '🗺️'
  if (cls === 'amenity') return '📍'
  return '📌'
}
