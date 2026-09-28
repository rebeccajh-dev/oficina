// ─── Screen 1: User Selection ─────────────────────────────────────────────────

import { useState } from "react"
import type { User } from "../interface/UserInterface"
import { USERS, HISTORY } from "../data/mock"
import { IconSearch, IconCheck, IconInfo } from "../icons/icons"

export function UserSelectScreen({ onSelect }: { onSelect: (u: User) => void }) {
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