// ─── Screen 1: User Selection ─────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import type { User } from '../interface/UserInterface'
import { api } from '../services/api'
import { IconSearch, IconCheck, IconInfo } from '../icons/icons'

export function UserSelectScreen({ onSelect }: { onSelect: (u: User) => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [incluirComunidade, setIncluirComunidade] = useState(false)

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getUsuarios(undefined, incluirComunidade)
      setUsers(data)
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err)
      setError(err?.message || 'Falha ao conectar com o backend em http://localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [incluirComunidade])

  const filtered = users.filter(u =>
    (u.nome || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.clube || u.club || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.papel || u.role || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalComHistorico = users.filter(u => u.tem_historico).length
  const totalColdStart = users.filter(u => u.cold_start).length

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Selecionar Usuário
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Escolha um perfil cadastrado no backend FastAPI para simular o sistema de recomendação
          </p>
        </div>

        {/* Status de Conexão com API */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '6px 14px', borderRadius: 20, border: '1px solid #e8e4da', fontSize: '0.78rem' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: error ? '#ef4444' : loading ? '#f59e0b' : '#10b981',
            display: 'inline-block',
            boxShadow: error ? '0 0 8px #ef4444' : '0 0 8px #10b981'
          }} />
          <span style={{ color: '#4b5563', fontWeight: 500 }}>
            {error ? 'API offline' : loading ? 'Sincronizando...' : 'API Conectada (FastAPI)'}
          </span>
        </div>
      </div>

      {/* Erro com botão de retry */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#b91c1c', fontSize: '0.85rem' }}>Não foi possível carregar os usuários da API</div>
            <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 2 }}>{error} (Verifique se o backend está ativo na porta 8000)</div>
          </div>
          <button onClick={carregarUsuarios} className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Search and toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
            <IconSearch />
          </span>
          <input
            className="input-field"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por nome, clube ou papel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#4b5563' }}>
          <input
            type="checkbox"
            checked={incluirComunidade}
            onChange={e => setIncluirComunidade(e.target.checked)}
            style={{ accentColor: '#B08D57' }}
          />
          <span>Incluir usuários simulados da comunidade (~200)</span>
        </label>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total de usuários', value: users.length },
          { label: 'Com histórico', value: totalComHistorico },
          { label: 'Cold-start', value: totalColdStart },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#1F2A44' }}>
              {loading ? '—' : s.value}
            </span>
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && users.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card" style={{ padding: '20px', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8e4da', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '60%', height: 14, background: '#e8e4da', borderRadius: 4 }} />
              <div style={{ width: '40%', height: 10, background: '#f0ece4', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* User cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(user => (
          <div
            key={user.id_usuario || user.id}
            className="card"
            style={{ padding: '20px', border: '1.5px solid transparent', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#B08D57')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div className="player-avatar-lg">
                  {user.initials}
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1F2A44', marginBottom: 2 }}>
                    {user.nome || user.name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: 6 }}>
                    {user.papel || user.role}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#1F2A44', color: 'white',
                      fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                      letterSpacing: '0.03em',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/></svg>
                      {user.clube || user.club}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {user.id_usuario}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                {user.tem_historico ? (
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconCheck />Com histórico
                  </span>
                ) : (
                  <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconInfo />Cold-start
                  </span>
                )}
                {user.perfil_teste && (
                  <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>Perfil Teste</span>
                )}
              </div>

              <div style={{ background: '#F3F1EC', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#4b5563', display: 'flex', justifyContent: 'space-between' }}>
                <span>Interações: <strong style={{ color: '#1F2A44' }}>{user.total_interacoes}</strong></span>
                <span>Avaliações: <strong style={{ color: '#B08D57' }}>{user.total_avaliacoes}</strong></span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
              onClick={() => onSelect(user)}
            >
              Entrar como este usuário
            </button>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
          Nenhum usuário encontrado para "{search}".
        </div>
      )}
    </div>
  )
}