import { useEffect, useState } from 'react'
import { IconX, IconCheck } from './icons/icons'
import type { User } from './interface/UserInterface'
import type { Player } from './interface/PlayerInterface'
import { MetricsScreen } from './screens/MetricsScreen'
import { RecommendationsScreen } from './screens/RecommendationScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { UserSelectScreen } from './screens/SelectUser'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import type { ScreenInterface } from './screens/ScreenInterface'
import { api } from './services/api'

// ─── Evaluation Modal ─────────────────────────────────────────────────────────

function EvaluationModal({
  player,
  onClose,
  onSave,
  isSaving,
}: {
  player: Player
  onClose: () => void
  onSave: (note: number, comment: string) => void
  isSaving?: boolean
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSaving) onClose() }}>
      <div className="modal-panel">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1F2A44' }}>Avaliar Jogador</div>
            <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 2 }}>
              Registra feedback na base e recalcula o modelo colaborativo
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} style={{ background: 'none', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', color: '#9ca3af', padding: 4 }}>
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Player info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', background: '#F3F1EC', borderRadius: 8 }}>
            <div className="player-avatar">{player.initials}</div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#1F2A44', fontSize: '0.95rem' }}>
                {player.nome_perfil || player.name}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                <span className="badge badge-navy">{player.position || player.categoria}</span>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{player.clube}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.72rem', fontFamily: 'monospace' }}>({player.id_item || player.id})</span>
              </div>
            </div>
          </div>

          {/* Star rating */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2A44', marginBottom: 10 }}>
              Nota de avaliação <span style={{ color: '#B08D57' }}>*</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  className="star-btn"
                  style={{ color: i <= (hover || rating) ? '#B08D57' : '#e0dbd2' }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  disabled={isSaving}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span style={{ marginLeft: 8, color: '#6b7280', fontSize: '0.82rem', alignSelf: 'center' }}>
                  {['', 'Insuficiente', 'Abaixo da média', 'Na média', 'Acima da média', 'Excelente'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2A44', marginBottom: 8 }}>
              Comentário <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
            </div>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Observações técnicas, contexto da avaliação..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={isSaving}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button
              className="btn-gold"
              style={{ flex: 2, opacity: rating === 0 || isSaving ? 0.5 : 1 }}
              disabled={rating === 0 || isSaving}
              onClick={() => onSave(rating, comment)}
            >
              {isSaving ? 'Gravando no backend...' : 'Salvar Avaliação'}
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
    const t = setTimeout(onDone, 3500)
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
  const [screen, setScreen] = useState<ScreenInterface>('user-select')
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [evalPlayer, setEvalPlayer] = useState<Player | null>(null)
  const [isSavingEval, setIsSavingEval] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function selectUser(u: User) {
    setActiveUser(u)
    setScreen('dashboard')
  }

  async function handleSaveEval(note: number, comment: string) {
    if (!evalPlayer || !activeUser) return

    const userId = activeUser.id_usuario || activeUser.id
    const itemId = evalPlayer.id_item || evalPlayer.id
    const playerName = evalPlayer.nome_perfil || evalPlayer.name

    try {
      setIsSavingEval(true)
      const resp = await api.registrarAvaliacao(userId, itemId, note, comment)

      // Atualiza activeUser com dados atualizados do backend
      if (resp.usuario) {
        setActiveUser(resp.usuario)
      }

      setEvalPlayer(null)
      setRefreshKey(k => k + 1)
      setToast(`Avaliação de ${playerName} gravada com nota ${note}! O modelo foi atualizado.`)
    } catch (err: any) {
      console.error('Erro ao salvar avaliação:', err)
      alert(`Falha ao registrar avaliação: ${err?.message || 'Erro desconhecido'}`)
    } finally {
      setIsSavingEval(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F3F1EC' }}>
      {/* Sidebar */}
      <Sidebar screen={screen} setScreen={setScreen} activeUser={activeUser} />

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar screen={screen} activeUser={activeUser} onSwitch={() => setScreen('user-select')} />

        <main style={{ flex: 1 }}>
          {screen === 'user-select' && (
            <UserSelectScreen onSelect={selectUser} />
          )}

          {screen === 'dashboard' && activeUser && (
            <DashboardScreen key={`dash-${activeUser.id_usuario || activeUser.id}-${refreshKey}`} user={activeUser} />
          )}
          {screen === 'dashboard' && !activeUser && (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '1rem', marginBottom: 8 }}>Selecione um usuário para ver o histórico.</div>
              <button className="btn-primary" onClick={() => setScreen('user-select')}>Selecionar usuário</button>
            </div>
          )}

          {screen === 'recommendations' && activeUser && (
            <RecommendationsScreen
              key={`recs-${activeUser.id_usuario || activeUser.id}-${refreshKey}`}
              user={activeUser}
              onEvaluate={setEvalPlayer}
              onFeedbackSuccess={msg => {
                setToast(msg)
                setRefreshKey(k => k + 1)
              }}
            />
          )}
          {screen === 'recommendations' && !activeUser && (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '1rem', marginBottom: 8 }}>Selecione um usuário para ver recomendações.</div>
              <button className="btn-primary" onClick={() => setScreen('user-select')}>Selecionar usuário</button>
            </div>
          )}

          {screen === 'metrics' && <MetricsScreen key={`metrics-${refreshKey}`} />}
        </main>
      </div>

      {/* Evaluation Modal */}
      {evalPlayer && (
        <EvaluationModal
          player={evalPlayer}
          onClose={() => !isSavingEval && setEvalPlayer(null)}
          onSave={handleSaveEval}
          isSaving={isSavingEval}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
