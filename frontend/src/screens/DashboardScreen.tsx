import { useState } from 'react'
import { InteractionBadge, Stars } from '../components/InteractionBadge'
import { IconX } from '../icons/icons'
import type { User } from '../interface/UserInterface'
import { HISTORY, POSITIONS, INTERACTION_TYPES } from '../data/mock'
import type { Player } from '../interface/PlayerInterface'


type DashboardProps = {
  user: User
  onEvaluate: (p: Player) => void
  onLogout: () => void
}


export function DashboardScreen({ user }: { user: User }) {
  const [posFilter, setPosFilter]   = useState('Todos')
  const [typeFilter, setTypeFilter] = useState('Todos')

  const history = HISTORY[user.id] || []
  const filtered = history.filter(h => {
    const matchPos  = posFilter === 'Todos'  || h.position === posFilter
    const matchType = typeFilter === 'Todos' || h.type === typeFilter
    return matchPos && matchType
  })

  const totalInter = history.length
  const totalAval  = history.filter(h => h.type === 'avaliou').length
  const posCounts = history.reduce<Record<string, number>>((acc, item) => {
    acc[item.positionKey] = (acc[item.positionKey] ?? 0) + 1
    return acc
  }, {})
  const topPos= Object.entries(posCounts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0])

  return (
    <div style={{ padding: '32px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Histórico de Interações
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '0.85rem' }}>
            <span style={{ color: '#B08D57', fontWeight: 600 }}>{user.name}</span>
            <span>·</span>
            <span>{user.club}</span>
            <span>·</span>
            <span>{user.role}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total de Interações', value: totalInter, sub: 'registradas', color: '#1F2A44' },
          { label: 'Avaliações',          value: totalAval,  sub: 'com nota',    color: '#B08D57' },
          { label: 'Posições Top',        value: topPos.join(' · ') || '—', sub: 'mais consultadas', color: '#1F2A44', isText: true },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ color: '#9ca3af', fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: c.isText ? '1rem' : '1.8rem', color: c.color, lineHeight: 1.1, marginBottom: 4 }}>{c.value}</div>
            <div style={{ color: '#9ca3af', fontSize: '0.73rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 0, borderRadius: '10px 10px 0 0', padding: '14px 20px', borderBottom: '1px solid #e8e4da', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>Filtrar por:</span>
        <div style={{ position: 'relative' }}>
          <select className="select-field" value={posFilter} onChange={e=>setPosFilter(e.target.value)}>
            {POSITIONS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative' }}>
          <select className="select-field" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            {INTERACTION_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        {(posFilter !== 'Todos' || typeFilter !== 'Todos') && (
          <button onClick={()=>{setPosFilter('Todos');setTypeFilter('Todos')}} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B08D57', fontSize: '0.78rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconX />Limpar filtros
          </button>
        )}
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '0.78rem' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚽</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b7280' }}>Nenhuma interação encontrada</div>
            <div style={{ fontSize: '0.82rem' }}>Ajuste os filtros para ver resultados</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F3F1EC' }}>
                {['Jogador','Clube','Posição','Tipo','Nota','Data'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2C3D5E, #1F2A44)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#B08D57', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                        fontFamily: 'Outfit, sans-serif',
                      }}>{row.player.split(' ').map((w: any[])=>w[0]).join('').slice(0,2)}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>{row.player}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>{row.club}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-navy">{row.position}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <InteractionBadge type={row.type} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {row.note ? <Stars value={row.note} /> : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}