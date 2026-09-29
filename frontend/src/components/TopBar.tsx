import type { User } from '../interface/UserInterface'
import type { ScreenInterface } from '../screens/ScreenInterface'

export function TopBar({
  screen,
  activeUser,
  onSwitch,
}: {
  screen?: ScreenInterface
  activeUser: User | null
  onSwitch: () => void
}) {
  const titles: Record<string, string> = {
    'user-select': 'Seleção de Usuário',
    'dashboard': 'Histórico de Interações',
    'recommendations': 'Recomendações de Jogadores',
    'metrics': 'Métricas do Sistema',
  }

  const currentTitle = screen ? titles[screen] || 'Gap Elenco' : 'Gap Elenco'

  return (
    <header style={{
      height: 58, background: 'white', borderBottom: '1px solid #e8e4da',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Gap Elenco</span>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#1F2A44', fontWeight: 600, fontSize: '0.85rem' }}>
          {currentTitle}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {activeUser ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1F2A44' }}>
                {activeUser.nome || activeUser.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {activeUser.clube || activeUser.club} · {activeUser.papel || activeUser.role}
              </div>
            </div>
            <button onClick={onSwitch} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
              Trocar perfil
            </button>
          </>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>
            Nenhum usuário ativo
          </span>
        )}
      </div>
    </header>
  )
}