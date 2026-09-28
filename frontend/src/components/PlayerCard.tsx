// ─── Player Card ──────────────────────────────────────────────────────────────

import type { Player } from "../interface/PlayerInterface"

export function PlayerCard({ player, isColdStart, onEvaluate, onDiscard, discarded }: {
  player: Player
  isColdStart: boolean
  onEvaluate: (p: Player) => void
  onDiscard: (id: number) => void
  discarded: boolean
}) {
  if (discarded) return null
  return (
    <div className="card" style={{ padding: '20px', border: '1.5px solid transparent', transition: 'all 0.2s', position: 'relative' }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='#e8e4da')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor='transparent')}
    >
      {/* Rank badge */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
        {isColdStart
          ? <span className="badge badge-gold">Popular</span>
          : <span className="badge badge-green">Novo para você</span>
        }
      </div>

      {/* Player info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div className="player-avatar-lg">{player.initials}</div>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1F2A44', marginBottom: 2 }}>{player.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-navy">{player.position}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>·</span>
            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{player.club}</span>
          </div>
        </div>
      </div>

      {/* Affinity score */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isColdStart ? 'Popularidade' : 'Score de Afinidade'}
          </span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#B08D57' }}>{player.affinity}%</span>
        </div>
        <div className="affinity-bar">
          <div className="affinity-fill" style={{ width: `${player.affinity}%` }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-gold" style={{ flex: 1, textAlign: 'center' }} onClick={() => onEvaluate(player)}>
          Avaliar
        </button>
        <button className="btn-outline" style={{ flex: 1, textAlign: 'center' }} onClick={() => onDiscard(player.id)}>
          Descartar
        </button>
      </div>
    </div>
  )
}