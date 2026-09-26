import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'user-select' | 'dashboard' | 'recommendations' | 'metrics'

interface User {
  id: number
  name: string
  club: string
  role: string
  hasHistory: boolean
  initials: string
}

interface Interaction {
  id: number
  player: string
  position: string
  positionKey: string
  type: 'visualizou' | 'avaliou' | 'favoritou'
  note?: number
  date: string
  club: string
}

interface Player {
  id: number
  name: string
  initials: string
  position: string
  positionKey: string
  club: string
  affinity: number
  popular?: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: 1, name: 'João Silva',     club: 'Arsenal FC',      role: 'Diretor de Scouting', hasHistory: true,  initials: 'JS' },
  { id: 2, name: 'María García',   club: 'FC Barcelona',    role: 'Analista de Desempenho', hasHistory: true,  initials: 'MG' },
  { id: 3, name: 'Pierre Dubois',  club: 'Paris SG',        role: 'Scout Sênior',        hasHistory: true,  initials: 'PD' },
  { id: 4, name: 'Hans Müller',    club: 'Bayern München',  role: 'Chefe de Recrutamento', hasHistory: false, initials: 'HM' },
  { id: 5, name: 'Linh Nguyen',    club: 'Ajax',            role: 'Analista Tático',     hasHistory: false, initials: 'LN' },
]

const HISTORY: Record<number, Interaction[]> = {
  1: [
    { id:1, player:'Florian Wirtz',    position:'Meia',     positionKey:'meia',     type:'avaliou',     note:5, date:'22/09/2026', club:'Bayer Leverkusen' },
    { id:2, player:'Leny Yoro',        position:'Zagueiro', positionKey:'zagueiro', type:'favoritou',            date:'20/09/2026', club:'Manchester United' },
    { id:3, player:'Rayan Cherki',     position:'Meia',     positionKey:'meia',     type:'avaliou',     note:4, date:'18/09/2026', club:'Liverpool FC' },
    { id:4, player:'Castello Lukeba',  position:'Zagueiro', positionKey:'zagueiro', type:'visualizou',           date:'15/09/2026', club:'RB Leipzig' },
    { id:5, player:'Warren Z-Emery',   position:'Volante',  positionKey:'volante',  type:'avaliou',     note:4, date:'12/09/2026', club:'Paris SG' },
    { id:6, player:'Evan Ferguson',    position:'Atacante', positionKey:'atacante', type:'visualizou',           date:'10/09/2026', club:'Brighton' },
    { id:7, player:'Jorrel Hato',      position:'Lateral',  positionKey:'lateral',  type:'avaliou',     note:3, date:'07/09/2026', club:'Ajax' },
    { id:8, player:'Lamine Yamal',     position:'Atacante', positionKey:'atacante', type:'favoritou',            date:'04/09/2026', club:'FC Barcelona' },
  ],
  2: [
    { id:1, player:'Pedri',            position:'Meia',     positionKey:'meia',     type:'avaliou',     note:5, date:'21/09/2026', club:'FC Barcelona' },
    { id:2, player:'Gavi',             position:'Volante',  positionKey:'volante',  type:'favoritou',            date:'19/09/2026', club:'FC Barcelona' },
    { id:3, player:'Benjamin Šeško',   position:'Atacante', positionKey:'atacante', type:'avaliou',     note:4, date:'16/09/2026', club:'Arsenal FC' },
    { id:4, player:'Kobbie Mainoo',    position:'Volante',  positionKey:'volante',  type:'visualizou',           date:'13/09/2026', club:'Manchester United' },
    { id:5, player:'Mike Maignan',     position:'Goleiro',  positionKey:'goleiro',  type:'avaliou',     note:5, date:'09/09/2026', club:'AC Milan' },
  ],
  3: [
    { id:1, player:'Kylian Mbappé',    position:'Atacante', positionKey:'atacante', type:'avaliou',     note:5, date:'23/09/2026', club:'Real Madrid' },
    { id:2, player:'Willian Pacho',    position:'Zagueiro', positionKey:'zagueiro', type:'avaliou',     note:4, date:'18/09/2026', club:'Paris SG' },
    { id:3, player:'Sávio',            position:'Atacante', positionKey:'atacante', type:'favoritou',            date:'14/09/2026', club:'Manchester City' },
    { id:4, player:'Máximo Perrone',   position:'Volante',  positionKey:'volante',  type:'visualizou',           date:'11/09/2026', club:'Valencia CF' },
  ],
}

const RECOMMENDATIONS: Record<string, Player[]> = {
  goleiro: [
    { id:1, name:'Bart Verbruggen',       initials:'BV', position:'Goleiro',  positionKey:'goleiro',  club:'Brighton',        affinity:91 },
    { id:2, name:'Giorgi Mamardashvili',  initials:'GM', position:'Goleiro',  positionKey:'goleiro',  club:'Liverpool FC',    affinity:86 },
    { id:3, name:'Andriy Lunin',          initials:'AL', position:'Goleiro',  positionKey:'goleiro',  club:'Real Madrid',     affinity:79 },
  ],
  zagueiro: [
    { id:4, name:'Leny Yoro',             initials:'LY', position:'Zagueiro', positionKey:'zagueiro', club:'Manchester Utd',  affinity:94 },
    { id:5, name:'Castello Lukeba',       initials:'CL', position:'Zagueiro', positionKey:'zagueiro', club:'RB Leipzig',      affinity:88 },
    { id:6, name:'Neraysho Kasanwirjo',   initials:'NK', position:'Zagueiro', positionKey:'zagueiro', club:'Inter Milan',     affinity:82 },
    { id:7, name:'Willian Pacho',         initials:'WP', position:'Zagueiro', positionKey:'zagueiro', club:'Paris SG',        affinity:76 },
  ],
  lateral: [
    { id:8, name:'Jorrel Hato',           initials:'JH', position:'Lateral',  positionKey:'lateral',  club:'Ajax',            affinity:89 },
    { id:9, name:'Alejandro Balde',       initials:'AB', position:'Lateral',  positionKey:'lateral',  club:'FC Barcelona',    affinity:84 },
    { id:10,name:'Destiny Udogie',        initials:'DU', position:'Lateral',  positionKey:'lateral',  club:'Tottenham',       affinity:78 },
  ],
  volante: [
    { id:11,name:'Warren Zaïre-Emery',    initials:'WZ', position:'Volante',  positionKey:'volante',  club:'Paris SG',        affinity:93 },
    { id:12,name:'Kobbie Mainoo',         initials:'KM', position:'Volante',  positionKey:'volante',  club:'Manchester Utd',  affinity:90 },
    { id:13,name:'Máximo Perrone',        initials:'MP', position:'Volante',  positionKey:'volante',  club:'Valencia CF',     affinity:84 },
    { id:14,name:'Camavinga',             initials:'CA', position:'Volante',  positionKey:'volante',  club:'Real Madrid',     affinity:80 },
    { id:15,name:'Khéphren Thuram',       initials:'KT', position:'Volante',  positionKey:'volante',  club:'Juventus',        affinity:74 },
  ],
  meia: [
    { id:16,name:'Florian Wirtz',         initials:'FW', position:'Meia',     positionKey:'meia',     club:'Bayer Leverkusen',affinity:97 },
    { id:17,name:'Rayan Cherki',          initials:'RC', position:'Meia',     positionKey:'meia',     club:'Liverpool FC',    affinity:91 },
    { id:18,name:'Pedri',                 initials:'PE', position:'Meia',     positionKey:'meia',     club:'FC Barcelona',    affinity:88 },
    { id:19,name:'Xavi Simons',           initials:'XS', position:'Meia',     positionKey:'meia',     club:'PSG / Leipzig',   affinity:83 },
  ],
  atacante: [
    { id:20,name:'Lamine Yamal',          initials:'LY', position:'Atacante', positionKey:'atacante', club:'FC Barcelona',    affinity:96 },
    { id:21,name:'Benjamin Šeško',        initials:'BŠ', position:'Atacante', positionKey:'atacante', club:'Arsenal FC',      affinity:89 },
    { id:22,name:'Evan Ferguson',         initials:'EF', position:'Atacante', positionKey:'atacante', club:'Brighton',        affinity:85 },
    { id:23,name:'Sávio',                 initials:'SÁ', position:'Atacante', positionKey:'atacante', club:'Manchester City', affinity:79 },
    { id:24,name:'Endrick',               initials:'EN', position:'Atacante', positionKey:'atacante', club:'Real Madrid',     affinity:73 },
  ],
}

const POPULAR_PLAYERS: Player[] = [
  { id:16,name:'Florian Wirtz',         initials:'FW', position:'Meia',     positionKey:'meia',     club:'Bayer Leverkusen',affinity:97, popular:true },
  { id:1, name:'Bart Verbruggen',       initials:'BV', position:'Goleiro',  positionKey:'goleiro',  club:'Brighton',        affinity:91, popular:true },
  { id:20,name:'Lamine Yamal',          initials:'LY', position:'Atacante', positionKey:'atacante', club:'FC Barcelona',    affinity:96, popular:true },
  { id:11,name:'Warren Zaïre-Emery',    initials:'WZ', position:'Volante',  positionKey:'volante',  club:'Paris SG',        affinity:93, popular:true },
  { id:4, name:'Leny Yoro',             initials:'LY', position:'Zagueiro', positionKey:'zagueiro', club:'Manchester Utd',  affinity:94, popular:true },
]

const METRICS = [
  { user:'João Silva',    club:'Arsenal FC',     interactions:8,  relevant:6, hits:5, precision:1.00, recall:0.83 },
  { user:'María García',  club:'FC Barcelona',   interactions:5,  relevant:4, hits:4, precision:0.80, recall:1.00 },
  { user:'Pierre Dubois', club:'Paris SG',       interactions:4,  relevant:3, hits:2, precision:0.40, recall:0.67 },
  { user:'Hans Müller',   club:'Bayern München', interactions:0,  relevant:0, hits:0, precision:0.00, recall:0.00 },
  { user:'Linh Nguyen',   club:'Ajax',           interactions:0,  relevant:0, hits:0, precision:0.00, recall:0.00 },
]

const POSITIONS = ['Todos','Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante']
const POSITION_KEYS: Record<string,string> = {
  'Todos':'todos','Goleiro':'goleiro','Zagueiro':'zagueiro','Lateral':'lateral',
  'Volante':'volante','Meia':'meia','Atacante':'atacante',
}
const INTERACTION_TYPES = ['Todos','visualizou','avaliou','favoritou']

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconHeart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

// ─── Shared Components ────────────────────────────────────────────────────────

function InteractionBadge({ type }: { type: string }) {
  if (type === 'avaliou')    return <span className="badge badge-gold" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconStar />Avaliou</span>
  if (type === 'favoritou')  return <span className="badge badge-green" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconHeart />Favoritou</span>
  return <span className="badge badge-blue" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconEye />Visualizou</span>
}

function Stars({ value }: { value: number }) {
  return (
    <span style={{color:'#B08D57',fontSize:'0.85rem',letterSpacing:1}}>
      {'★'.repeat(value)}{'☆'.repeat(5-value)}
    </span>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ screen, setScreen, activeUser }: {
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

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ activeUser, onSwitch }: { activeUser: User | null; onSwitch: () => void }) {
  const titles: Record<string, string> = {
    'user-select': 'Seleção de Usuário',
    'dashboard': 'Histórico de Interações',
    'recommendations': 'Recomendações',
    'metrics': 'Métricas do Sistema',
  }
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
          {activeUser ? Object.values(titles)[Object.keys(titles).indexOf(Object.keys(titles).find(k=>k)!)] : 'Início'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {activeUser ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1F2A44' }}>{activeUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{activeUser.club} · {activeUser.role}</div>
            </div>
            <button onClick={onSwitch} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Trocar</button>
          </>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>Nenhum usuário selecionado</span>
        )}
      </div>
    </header>
  )
}

// ─── Screen 1: User Selection ─────────────────────────────────────────────────

function UserSelectScreen({ onSelect }: { onSelect: (u: User) => void }) {
  const [search, setSearch] = useState('')
  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.club.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
          Selecionar Usuário
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Escolha um perfil de teste para simular o sistema de recomendação</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 28 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
          <IconSearch />
        </span>
        <input
          className="input-field"
          style={{ paddingLeft: 34 }}
          placeholder="Buscar por nome ou clube..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total de usuários', value: USERS.length },
          { label: 'Com histórico', value: USERS.filter(u=>u.hasHistory).length },
          { label: 'Sem histórico (cold-start)', value: USERS.filter(u=>!u.hasHistory).length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#1F2A44' }}>{s.value}</span>
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* User cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(user => (
          <div key={user.id} className="card" style={{ padding: '20px', border: '1.5px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#B08D57')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div className="player-avatar-lg">
                {user.initials}
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1F2A44', marginBottom: 2 }}>{user.name}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: 6 }}>{user.role}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#1F2A44', color: 'white',
                    fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    letterSpacing: '0.03em',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/></svg>
                    {user.club}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {user.hasHistory ? (
                <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconCheck />Com histórico
                </span>
              ) : (
                <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconInfo />Cold-start
                </span>
              )}
            </div>

            {user.hasHistory && (
              <div style={{ background: '#F3F1EC', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#4b5563' }}>
                <span style={{ fontWeight: 600, color: '#1F2A44' }}>{HISTORY[user.id]?.length || 0}</span> interações registradas
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }} onClick={() => onSelect(user)}>
              Entrar como este usuário
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 2: Dashboard / History ───────────────────────────────────────────

function DashboardScreen({ user }: { user: User }) {
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
  const posCounts  = history.reduce((acc, h) => { acc[h.position] = (acc[h.position]||0)+1; return acc }, {} as Record<string,number>)
  const topPos     = Object.entries(posCounts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0])

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
                      }}>{row.player.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
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

// ─── Player Card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, isColdStart, onEvaluate, onDiscard, discarded }: {
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

// ─── Screen 3 & 5: Recommendations / Cold-start ───────────────────────────────

function RecommendationsScreen({ user, onEvaluate }: { user: User; onEvaluate: (p: Player) => void }) {
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

// ─── Screen 6: Metrics ────────────────────────────────────────────────────────

function MetricsScreen() {
  const avgPrecision = (METRICS.filter(m=>m.interactions>0).reduce((s,m)=>s+m.precision,0)/METRICS.filter(m=>m.interactions>0).length).toFixed(2)
  const avgRecall    = (METRICS.filter(m=>m.interactions>0).reduce((s,m)=>s+m.recall,0)/METRICS.filter(m=>m.interactions>0).length).toFixed(2)

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>Métricas do Sistema</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avaliação de desempenho da filtragem colaborativa · Temporada 2025/26</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Precision@5 Médio</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>{avgPrecision}</div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>acertos nos top-5 / usuários ativos</div>
        </div>
        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Recall@5 Médio</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>{avgRecall}</div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>cobertura dos itens relevantes</div>
        </div>
        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Usuários Ativos</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>3</div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>de 5 usuários com histórico</div>
        </div>
        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Interações</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>17</div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>no sistema de recomendação</div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 18, background: '#B08D57', borderRadius: 2 }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1F2A44' }}>Comparativo por Usuário</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F3F1EC' }}>
              {['Usuário','Clube','Interações','Itens Relevantes','Acertos@5','Precision@5','Recall@5'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => (
              <tr key={i} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: m.interactions > 0 ? 'linear-gradient(135deg, #2C3D5E, #1F2A44)' : '#e8e4da',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: m.interactions > 0 ? '#B08D57' : '#9ca3af',
                      fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                      fontFamily: 'Outfit, sans-serif',
                    }}>{m.user.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>{m.user}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>{m.club}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#1F2A44' }}>{m.interactions}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>{m.relevant}</td>
                <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>{m.hits}</td>
                <td style={{ padding: '12px 16px' }}>
                  {m.interactions > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 5, borderRadius: 3, background: '#e8e4da', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${m.precision*100}%`, background: '#B08D57', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, color: m.precision >= 0.8 ? '#15803d' : m.precision >= 0.5 ? '#B08D57' : '#b91c1c', fontSize: '0.82rem' }}>{m.precision.toFixed(2)}</span>
                    </div>
                  ) : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>N/A</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {m.interactions > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 5, borderRadius: 3, background: '#e8e4da', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${m.recall*100}%`, background: '#1F2A44', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, color: m.recall >= 0.8 ? '#15803d' : m.recall >= 0.5 ? '#1F2A44' : '#b91c1c', fontSize: '0.82rem' }}>{m.recall.toFixed(2)}</span>
                    </div>
                  ) : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>N/A</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 20px', background: '#F3F1EC', borderTop: '1px solid #e8e4da', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            <span style={{ fontWeight: 700, color: '#1F2A44' }}>Precision@5</span> = acertos no top-5 ÷ 5
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            <span style={{ fontWeight: 700, color: '#1F2A44' }}>Recall@5</span> = acertos no top-5 ÷ total de itens relevantes
          </div>
        </div>
      </div>
    </div>
  )
}

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
  useState(() => { setTimeout(onDone, 3000) })
  return (
    <div className="toast">
      <span style={{ color: '#B08D57' }}><IconCheck /></span>
      {message}
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState<Screen>('user-select')
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [evalPlayer, setEvalPlayer] = useState<Player | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  function selectUser(u: User) {
    setActiveUser(u)
    setScreen('dashboard')
  }

  function handleSaveEval(note: number, comment: string) {
    setEvalPlayer(null)
    setToast(`Avaliação de ${evalPlayer?.name} registrada com ${note} estrela${note>1?'s':''}!`)
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
