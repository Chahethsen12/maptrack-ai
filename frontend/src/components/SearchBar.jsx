export default function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <span style={{
        position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-faint)', fontSize: 13, pointerEvents: 'none',
      }}>⌕</span>
      <input
        className="form-input"
        style={{ paddingLeft: 26 }}
        placeholder="Search by title, note or category…"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text-faint)',
            cursor: 'pointer', fontSize: 13, lineHeight: 1,
          }}
        >✕</button>
      )}
    </div>
  )
}
