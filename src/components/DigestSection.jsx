import AlertBanner from './AlertBanner.jsx'
import DigestCard from './DigestCard.jsx'

export default function DigestSection({ section, dismissed, onDismiss }) {
  const visibleAlerts = (section.alerts ?? []).filter((a) => !dismissed.has(a.id))
  const visibleCards = (section.cards ?? []).filter((c) => !dismissed.has(c.id))

  if (visibleAlerts.length === 0 && visibleCards.length === 0) return null

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14,
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 22 }}>{section.emoji}</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>{section.title}</h2>
        {section.subtitle && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {section.subtitle}
          </span>
        )}
      </div>

      {(section.alerts ?? []).map((alert) => (
        <AlertBanner key={alert.id} alert={alert} dismissed={dismissed} onDismiss={onDismiss} />
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(section.cards ?? []).map((card) => (
          <DigestCard key={card.id} card={card} dismissed={dismissed} onDismiss={onDismiss} />
        ))}
      </div>
    </section>
  )
}
