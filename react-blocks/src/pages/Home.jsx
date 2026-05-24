import { Link } from 'react-router-dom'
import { notions } from '../notions'

const niveauColor = {
  'Débutant': '#4ade80',
  'Intermédiaire': '#fbbf24',
  'Avancé': '#f87171',
}

export default function Home() {
  const débutant = notions.filter(n => n.niveau === 'Débutant')
  const intermédiaire = notions.filter(n => n.niveau === 'Intermédiaire')
  const avancé = notions.filter(n => n.niveau === 'Avancé')

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚛️</div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 8px' }}>
          React Blocs
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Apprends React notion par notion, avec des démos interactives.
        </p>
      </div>

      {[
        { label: 'Débutant', items: débutant },
        { label: 'Intermédiaire', items: intermédiaire },
        { label: 'Avancé', items: avancé },
      ].map(({ label, items }) => (
        <div key={label} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
              background: niveauColor[label] + '22',
              color: niveauColor[label],
            }}>{label}</span>
            <div style={{ flex: 1, height: '1px', background: '#2d3148' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(n => (
              <Link key={n.id} to={`/notion/${n.id}`}>
                <div style={{
                  padding: '14px 16px',
                  background: '#1a1d27',
                  borderRadius: '12px',
                  border: '1px solid #2d3148',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#6c63ff'
                    e.currentTarget.style.background = '#1e2030'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#2d3148'
                    e.currentTarget.style.background = '#1a1d27'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{n.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', color: '#e2e8f0', margin: '0 0 2px', fontSize: '15px' }}>
                      {n.titre}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.description}
                    </p>
                  </div>
                  <span style={{ color: '#6c63ff', fontSize: '18px' }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '16px' }}>
        {notions.length} notions — de nouvelles arrivent régulièrement ✨
      </p>
    </div>
  )
}
