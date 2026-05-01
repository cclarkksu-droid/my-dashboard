import { useState, useCallback } from 'react'
import digest from './data/digest.json'
import DigestSection from './components/DigestSection.jsx'

const STORAGE_KEY = `dismissed_${digest.generated_at?.split('T')[0] ?? 'default'}`

function loadDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveDismissed(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

function formatDate(isoString) {
  const d = isoString ? new Date(isoString) : new Date()
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function App() {
  const [dismissed, setDismissed] = useState(loadDismissed)

  const dismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDismissed(next)
      return next
    })
  }, [])

  const restoreAll = useCallback(() => {
    setDismissed(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const dismissedCount = dismissed.size

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 80px' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 28, paddingBottom: 18,
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            Chris's <span style={{ color: 'var(--accent)' }}>Morning Briefing</span>
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {formatDate(digest.generated_at)}
          </div>
        </div>
        {dismissedCount > 0 && (
          <button
            onClick={restoreAll}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '8px 12px', borderRadius: 6, fontSize: 13, marginTop: 2,
              flexShrink: 0
            }}
          >
            Restore ({dismissedCount})
          </button>
        )}
      </header>

      {digest.sections.map((section) => (
        <DigestSection
          key={section.id}
          section={section}
          dismissed={dismissed}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
}
