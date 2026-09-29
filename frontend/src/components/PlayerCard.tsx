// ─── Player Card ──────────────────────────────────────────────────────────────

import type { Player } from '../interface/PlayerInterface'

export function PlayerCard({
  player,
  isColdStart,
  onEvaluate,
  onDiscard,
  discarded,
  isDiscarding,
}: {
  player: Player
  isColdStart: boolean
  onEvaluate: (p: Player) => void
  onDiscard: (id: string) => void
  discarded?: boolean
  isDiscarding?: boolean
}) {
  if (discarded) return null

  const isPopular = player.origem === 'popularidade' || player.popular || isColdStart
  const scorePercent = player.score_pct ?? player.affinity ?? 0
  const playerId = player.id_item || player.id

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        border: '1.5px solid transparent',
        transition: 'all 0.2s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isDiscarding ? 0.5 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#B08D57')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
    >
      <div>
        {/* Rank / Origin badge */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
          {isPopular ? (
            <span className="badge badge-gold" title="Recomendação baseada na popularidade geral">
              Popular
            </span>
          ) : (
            <span className="badge badge-green" title="Filtragem colaborativa item-based personalizada">
              Afinidade
            </span>
          )}
        </div>

        {/* Player info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div className="player-avatar-lg">
            {player.initials || player.nome_perfil.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, paddingRight: 60 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1F2A44', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {player.nome_perfil || player.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-navy">
                {player.position || player.categoria}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>·</span>
              <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                {player.clube}
              </span>
            </div>
          </div>
        </div>

        {/* Metadados adicionais: Liga / Idade / Nacionalidade */}
        <div style={{ display: 'flex', gap: 10, fontSize: '0.73rem', color: '#6b7280', marginBottom: 16, background: '#F8F6F0', padding: '6px 10px', borderRadius: 6 }}>
          {player.idade && <span>Idade: <strong>{player.idade} anos</strong></span>}
          {player.nacionalidade && <span>País: <strong>{player.nacionalidade}</strong></span>}
          {player.liga && <span style={{ marginLeft: 'auto', color: '#8F6E3E' }}>{player.liga}</span>}
        </div>

        {/* Affinity / Popularity score */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isPopular ? 'Popularidade' : 'Score de Afinidade'}
            </span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#B08D57' }}>
              {scorePercent}%
            </span>
          </div>
          <div className="affinity-bar">
            <div
              className="affinity-fill"
              style={{
                width: `${Math.min(100, Math.max(5, scorePercent))}%`,
                background: isPopular ? 'linear-gradient(90deg, #9ca3af, #B08D57)' : 'linear-gradient(90deg, #B08D57, #C9A96E)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-gold"
          style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
          onClick={() => onEvaluate(player)}
          disabled={isDiscarding}
        >
          Avaliar
        </button>
        <button
          className="btn-outline"
          style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
          onClick={() => onDiscard(playerId)}
          disabled={isDiscarding}
        >
          {isDiscarding ? 'Descartando...' : 'Descartar'}
        </button>
      </div>
    </div>
  )
}