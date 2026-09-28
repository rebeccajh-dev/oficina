import { useState } from 'react'
import {PlayerCard} from '../components/PlayerCard'
import type { User } from '../interface/UserInterface'
import type { Player } from '../interface/PlayerInterface'
import { POPULAR_PLAYERS, RECOMMENDATIONS, POSITION_KEYS } from '../data/mock'
import { IconInfo } from '../icons/icons'


export function RecommendationsScreen({ user, onEvaluate }: { user: User; onEvaluate: (p: Player) => void }) {
  const isColdStart = !user.hasHistory
  const [posFilter, setPosFilter] = useState('volante')
  const [discarded, setDiscarded] = useState<number[]>([])

  const players = isColdStart
    ? POPULAR_PLAYERS.filter(p => p.positionKey === posFilter)
    : (RECOMMENDATIONS[posFilter] || [])

  const visible = players.filter(p => !discarded.includes(p.id))

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
          Recomendações
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          {isColdStart ? 'Jogadores mais bem avaliados na plataforma' : `Top recomendações personalizadas para ${user.name}`}
        </p>
      </div>

      {/* Cold-start banner */}
      {isColdStart && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'rgba(176, 141, 87, 0.08)', border: '1px solid rgba(176, 141, 87, 0.3)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 24,
        }}>
          <div style={{ color: '#B08D57', marginTop: 1, flexShrink: 0 }}><IconInfo /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#8F6E3E', marginBottom: 2 }}>Recomendações baseadas em popularidade</div>
            <div style={{ fontSize: '0.8rem', color: '#92794a' }}>Interaja com jogadores para personalizar suas sugestões e ativar a filtragem colaborativa.</div>
          </div>
        </div>
      )}

      {/* Gap position filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 18, background: '#B08D57', borderRadius: 2 }} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>Gap por Posição</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(POSITION_KEYS).filter(([l])=>l!=='Todos').map(([label, key]) => (
              <button key={key} className={`chip ${posFilter === key ? 'active' : ''}`} onClick={() => { setPosFilter(key); setDiscarded([]) }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontWeight: 600, color: '#1F2A44', fontSize: '0.9rem' }}>
            {Object.keys(POSITION_KEYS).find(k=>POSITION_KEYS[k]===posFilter)} · Top {visible.length}
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 6 }}>jogadores recomendados</span>
        </div>
        {!isColdStart && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F1EC', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', color: '#6b7280' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#B08D57"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Filtragem colaborativa ativa
          </span>
        )}
      </div>

      {/* Player grid */}
      {visible.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {players.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              isColdStart={isColdStart}
              onEvaluate={onEvaluate}
              onDiscard={id => setDiscarded(d => [...d, id])}
              discarded={discarded.includes(p.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.75rem' }}>⚽</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#1F2A44', marginBottom: 6 }}>Sem recomendações nesta posição</div>
          <div style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: 320, margin: '0 auto' }}>
            {isColdStart
              ? 'Nenhum jogador popular encontrado para esta posição no momento.'
              : 'Ainda não temos dados suficientes para recomendar jogadores nesta posição. Explore outras categorias.'}
          </div>
        </div>
      )}
    </div>
  )
}