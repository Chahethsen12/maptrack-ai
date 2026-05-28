import { useState, useCallback } from 'react'

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  return { toasts, push }
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" role="alert" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role="status">
          <span className="toast-dot" aria-hidden="true" />
          {t.message}
        </div>
      ))}
    </div>
  )
}
