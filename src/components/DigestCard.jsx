import { useRef, useState } from 'react'

const SWIPE_THRESHOLD = 80

export default function DigestCard({ card, dismissed, onDismiss }) {
  const [offset, setOffset] = useState(0)
  const [fading, setFading] = useState(false)
  const startX = useRef(null)

  if (dismissed.has(card.id)) return null

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX
  }

  function handleTouchMove(e) {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffset(dx)
  }

  function handleTouchEnd() {
    if (offset < -SWIPE_THRESHOLD) {
      triggerDismiss()
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  function triggerDismiss() {
    setFading(true)
    setTimeout(() => onDismiss(card.id), 220)
  }

  const tagClass = `tag tag-${card.tag ?? 'default'}`

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '14px 14px 14px 16px',
        position: 'relative',
        transform: `translateX(${offset}px)`,
        opacity: fading ? 0 : 1,
        transition: fading
          ? 'opacity 0.2s, transform 0.2s'
          : offset !== 0 ? 'none' : 'transform 0.15s ease-out',
        touchAction: 'pan-y'
      }}
    >
      {/* Dismiss button (tap target, visible on desktop) */}
      <button
        onClick={triggerDismiss}
        aria-label="Dismiss card"
        style={{
          position: 'absolute', right: 10, top: 10,
          background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 20, lineHeight: 1,
          padding: '2px 6px', borderRadius: 4
        }}
      >×</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, paddingRight: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
          {card.title}
        </div>
        {card.tag && <span className={tagClass}>{card.tag}</span>}
      </div>

      {card.date && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {card.date}
        </div>
      )}

      <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: card.alert ? 10 : 0 }}>
        {card.text}
      </div>

      {card.alert && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: 'rgba(252,129,129,0.06)',
          borderLeft: '2px solid var(--red)',
          padding: '7px 10px', borderRadius: 4,
          fontSize: 13, color: 'var(--red)'
        }}>
          ⚠️ {card.alert}
        </div>
      )}
    </div>
  )
}
