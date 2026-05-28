import { useState, useEffect } from 'react'
import { CATEGORIES, catClass, formatCoord } from '../utils'
import { aiCategorize } from '../api'

const EMPTY = { title: '', note: '', category: 'uncategorized' }

export default function PlaceForm({ pending, editing, onSave, onCancel, toast }) {
  const [form, setForm]           = useState(EMPTY)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult]   = useState(null)
  const [saving, setSaving]       = useState(false)

  // Populate form when editing an existing place
  useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, note: editing.note || '', category: editing.category })
      setAiResult(null)
    } else {
      setForm(EMPTY)
      setAiResult(null)
    }
  }, [editing, pending])

  const isEdit = !!editing
  const coords = editing
    ? { lat: editing.lat, lng: editing.lng }
    : pending

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (field !== 'category') setAiResult(null)
  }

  async function handleAICategorize() {
    if (!form.title.trim()) return
    setAiLoading(true)
    try {
      const res = await aiCategorize(form.title, form.note)
      setAiResult(res)
      setForm(f => ({ ...f, category: res.category }))
    } catch {
      toast('AI categorization failed — try again', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast('Title is required', 'error'); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        lat: coords.lat,
        lng: coords.lng,
      })
      setForm(EMPTY)
      setAiResult(null)
    } finally {
      setSaving(false)
    }
  }

  if (!pending && !editing) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📍</div>
        <div className="empty-title">No location selected</div>
        <div className="empty-sub">Click anywhere on the map to drop a pin, or use the "My Location" button.</div>
      </div>
    )
  }

  return (
    <div>
      <div className="form-section-title">
        {isEdit ? 'Edit place' : 'New place'}
      </div>

      {coords && (
        <div className="form-group">
          <label className="form-label">Coordinates</label>
          <div className="coords-display">
            <div className="coord-box" title="Latitude must be between -90 and 90"><span>lat</span>{formatCoord(coords.lat)}</div>
            <div className="coord-box" title="Longitude must be between -180 and 180"><span>lng</span>{formatCoord(coords.lng)}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--mono)' }}>
            Bounds: lat ∈ [-90, 90], lng ∈ [-180, 180]
          </div>
        </div>
      )}

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <label className="form-label">Title *</label>
          <span className="form-hint">{form.title.length}/255</span>
        </div>
        <input
          className="form-input"
          placeholder="e.g. Favourite coffee spot"
          value={form.title}
          maxLength="255"
          onChange={e => set('title', e.target.value)}
          aria-describedby="title-error"
        />
        {!form.title.trim() && pending && (
          <div id="title-error" className="form-error" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>✕ Title required to save</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Note</label>
        <textarea
          className="form-textarea"
          placeholder="What's special about this place?"
          value={form.note}
          onChange={e => set('note', e.target.value)}
        />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <label className="form-label" style={{ margin: 0 }}>Category</label>
          <button
            className="btn btn-ai"
            onClick={handleAICategorize}
            disabled={aiLoading || !form.title.trim()}
          >
            {aiLoading ? <span className="spinner" /> : '✦'}
            {aiLoading ? 'Categorizing…' : 'AI suggest'}
          </button>
        </div>
        <select
          className="form-select"
          value={form.category}
          onChange={e => set('category', e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {aiResult && (
          <div className="ai-categorize-row">
            <span className="ai-badge">✦ {aiResult.category}</span>
            <span className="ai-provider">
              {aiResult.provider} · {aiResult.confidence} confidence
            </span>
          </div>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onCancel} aria-label="Cancel place form">Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} aria-label={isEdit ? 'Save place changes' : 'Save new place'}>
          {saving ? <span className="spinner" /> : null}
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save place'}
        </button>
      </div>
    </div>
  )
}
