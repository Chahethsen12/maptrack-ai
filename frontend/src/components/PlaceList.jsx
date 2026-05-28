import { useState } from 'react'
import { catClass, formatDate, CATEGORIES } from '../utils'
import { aiSummarize } from '../api'
import SearchBar from './SearchBar'

function AISummaryPanel({ places, toast }) {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      const res = await aiSummarize()
      setResult(res)
    } catch {
      toast('AI summary failed — check your API keys', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title"><span>✦</span> AI Summary</div>
        <button className="btn btn-ai" onClick={run} disabled={loading || places.length === 0}>
          {loading ? <><span className="spinner" /> Thinking…</> : 'Summarize'}
        </button>
      </div>
      {result ? (
        <>
          <div className="ai-summary-text">{result.summary}</div>
          <div className="ai-footer">
            <span className="ai-meta">{result.place_count} places · via {result.provider}</span>
          </div>
        </>
      ) : (
        <div className="ai-summary-text loading">
          {loading ? 'Analysing your saved places…' : 'Get an AI-generated overview of your location habits and patterns.'}
        </div>
      )}
    </div>
  )
}

export default function PlaceList({ places, activeId, onSelect, onEdit, onDelete, toast }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery]   = useState('')

  const usedCategories = [...new Set(places.map(p => p.category))]

  const filtered = places
    .filter(p => filter === 'all' || p.category === filter)
    .filter(p => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        (p.note || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    })

  return (
    <div>
      <AISummaryPanel places={places} toast={toast} />

      <div className="places-header">
        <div className="form-section-title" style={{ margin: 0 }}>Saved Places</div>
        <div className="places-count">{filtered.length} / {places.length}</div>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      {usedCategories.length > 0 && (
        <div className="filter-row">
          <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          {usedCategories.map(c => (
            <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-title">
            {query ? 'No results found' : places.length === 0 ? 'No places saved yet' : 'No places in this category'}
          </div>
          <div className="empty-sub">
            {query
              ? `No places match "${query}". Try a different search term.`
              : places.length === 0
              ? 'Click on the map or use "My Location" to start tracking.'
              : 'Try selecting a different filter above.'}
          </div>
        </div>
      ) : (
        filtered.map(place => (
          <PlaceCard
            key={place.id}
            place={place}
            active={place.id === activeId}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}

function PlaceCard({ place, active, onSelect, onEdit, onDelete }) {
  return (
    <div className={`place-card ${active ? 'active' : ''}`} onClick={() => onSelect(place)}>
      <div className="place-card-top">
        <div className="place-card-title">{place.title}</div>
        <span className={`place-cat ${catClass(place.category)}`}>{place.category}</span>
      </div>
      {place.note && <div className="place-note">{place.note}</div>}
      <div className="place-meta">
        <span className="place-time">{formatDate(place.created_at)}</span>
        <div className="place-actions">
          <button className="icon-btn" title="Edit" onClick={e => { e.stopPropagation(); onEdit(place) }}>✎</button>
          <button className="icon-btn del" title="Delete" onClick={e => { e.stopPropagation(); onDelete(place) }}>✕</button>
        </div>
      </div>
    </div>
  )
}
