export default function AlertBanner({ alert, dismissed, onDismiss }) {
  if (dismissed.has(alert.id)) return null

  return (
    <div style={{
      background: 'rgba(252,129,129,0.08)',
      borderLeft: '4px solid var(--red)',
      padding: '12px 16px',
      marginBottom: 12,
      borderRadius: 6,
      position: 'relative'
    }}>
      <button
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', right: 10, top: 10,
          background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 20, lineHeight: 1,
          padding: '2px 4px'
        }}
      >×</button>

      <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {alert.icon} {alert.title}
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alert.items.map((item, i) => (
          <li key={i} style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--amber)', fontWeight: 700, flexShrink: 0 }}>→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
