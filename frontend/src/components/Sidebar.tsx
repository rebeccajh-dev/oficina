import { IconHome, IconHistory, IconStar, IconBarChart } from '../icons/icons'
import type { User } from '../interface/UserInterface'



type Screen = 'user-select' | 'dashboard' | 'recommendations' | 'metrics'

export function Sidebar({ screen, setScreen, activeUser }: {
  screen: Screen
  setScreen: (s: Screen) => void
  activeUser: User | null
}) {
  const nav = [
    { id: 'user-select' as Screen,    label: 'Usuários',          icon: <IconHome /> },
    { id: 'dashboard'   as Screen,    label: 'Histórico',         icon: <IconHistory /> },
    { id: 'recommendations' as Screen,label: 'Recomendações',     icon: <IconStar /> },
    { id: 'metrics'     as Screen,    label: 'Métricas',          icon: <IconBarChart /> },
  ]
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#1F2A44',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #B08D57, #C9A96E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>Gap Elenco</div>
            <div style={{ color: '#B08D57', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Scouting System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '14px 12px', flex: 1 }}>
        <div style={{ color: '#5a6a87', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 4px 8px' }}>Navegação</div>
        {nav.map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${screen === item.id ? 'active' : ''}`}
            onClick={() => setScreen(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Active user */}
      {activeUser && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ color: '#5a6a87', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Usuário Ativo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #B08D57, #C9A96E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
            }}>{activeUser.initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.name}</div>
              <div style={{ color: '#8a9ab8', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.club}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}