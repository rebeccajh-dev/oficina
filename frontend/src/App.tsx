import { useEffect, useState } from 'react'
import {   IconX, IconCheck } from './icons/icons'
import type { User } from './interface/UserInterface'
import type { Player } from './interface/PlayerInterface'
import { MetricsScreen } from './screens/MetricsScreen'
import { RecommendationsScreen } from './screens/RecommendationScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { UserSelectScreen } from './screens/SelectUser'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import type { ScreenInterface } from './screens/ScreenInterface'

// ─── Types ────────────────────────────────────────────────────────────────────

// usuários mockados mudar isso aqui talvez nao sei se da pra fazer uma api pra isso



// ─── Evaluation Modal ─────────────────────────────────────────────────────────

function EvaluationModal({ player, onClose, onSave }: {
  player: Player
  onClose: () => void
  onSave: (note: number, comment: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover]   = useState(0)
  const [comment, setComment] = useState('')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1F2A44' }}>Avaliar Jogador</div>
            <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 2 }}>Registre sua avaliação técnica</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><IconX /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Player info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', background: '#F3F1EC', borderRadius: 8 }}>
            <div className="player-avatar">{player.initials}</div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#1F2A44', fontSize: '0.95rem' }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                <span className="badge badge-navy">{player.position}</span>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{player.club}</span>
              </div>
            </div>
          </div>

          {/* Star rating */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2A44', marginBottom: 10 }}>Nota de avaliação <span style={{ color: '#B08D57' }}>*</span></div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  className="star-btn"
                  style={{ color: i <= (hover || rating) ? '#B08D57' : '#e0dbd2' }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                >★</button>
              ))}
              {rating > 0 && (
                <span style={{ marginLeft: 8, color: '#6b7280', fontSize: '0.82rem', alignSelf: 'center' }}>
                  {['','Insuficiente','Abaixo da média','Na média','Acima da média','Excelente'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2A44', marginBottom: 8 }}>Comentário <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></div>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Observações técnicas, contexto da avaliação..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button
              className="btn-gold"
              style={{ flex: 2, opacity: rating === 0 ? 0.5 : 1 }}
              disabled={rating === 0}
              onClick={() => onSave(rating, comment)}
            >
              Salvar Avaliação
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [message, onDone])

  return (
    <div className="toast">
      <span style={{ color: '#B08D57' }}><IconCheck /></span>
      {message}
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState<ScreenInterface>('user-select')
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [evalPlayer, setEvalPlayer] = useState<Player | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  function selectUser(u: User) {
    setActiveUser(u)
    setScreen('dashboard')
  }

  function handleSaveEval(note: number, _comment: string) {
    if (!evalPlayer) return
    const name = evalPlayer.name
    setEvalPlayer(null)
    setToast(`Avaliação de ${name} registrada com ${note} estrela${note > 1 ? 's' : ''}!`)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F3F1EC' }}>
      {/* Sidebar */}
      <Sidebar screen={screen} setScreen={setScreen} activeUser={activeUser} />

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar activeUser={activeUser} onSwitch={() => setScreen('user-select')} />

        <main style={{ flex: 1 }}>
          {screen === 'user-select' && <UserSelectScreen onSelect={selectUser} />}
          {screen === 'dashboard' && activeUser && <DashboardScreen user={activeUser} />}
          {screen === 'dashboard' && !activeUser && (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '1rem', marginBottom: 8 }}>Selecione um usuário para ver o histórico.</div>
              <button className="btn-primary" onClick={() => setScreen('user-select')}>Selecionar usuário</button>
            </div>
          )}
          {screen === 'recommendations' && activeUser && (
            <RecommendationsScreen user={activeUser} onEvaluate={setEvalPlayer} />
          )}
          {screen === 'recommendations' && !activeUser && (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '1rem', marginBottom: 8 }}>Selecione um usuário para ver recomendações.</div>
              <button className="btn-primary" onClick={() => setScreen('user-select')}>Selecionar usuário</button>
            </div>
          )}
          {screen === 'metrics' && <MetricsScreen />}
        </main>
      </div>

      {/* Evaluation Modal */}
      {evalPlayer && (
        <EvaluationModal
          player={evalPlayer}
          onClose={() => setEvalPlayer(null)}
          onSave={handleSaveEval}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
