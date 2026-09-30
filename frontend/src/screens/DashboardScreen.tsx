import { useEffect, useMemo, useRef, useState } from 'react'
import { InteractionBadge, Stars } from '../components/InteractionBadge'
import { IconX } from '../icons/icons'
import type { CategoriaInfo, HistoricoResponse } from '../interface/ApiInterface'
import { api } from '../services/api'
import type { Interaction, User } from '../interface/ApiInterface'


// Minúsculas e sem acento: "Vinícius" casa com "vinicius".
const normalizar = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function DashboardScreen({ user }: { user: User }) {
  const userId = user.id_usuario || user.id

  const [busca, setBusca] = useState('')
  const [posFilter, setPosFilter] = useState('Todos')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [categorias, setCategorias] = useState<CategoriaInfo[]>([])
  const [historico, setHistorico] = useState<HistoricoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Evita que uma resposta antiga sobrescreva a mais recente ao trocar filtros rápido.
  const ultimaRequisicao = useRef(0)

  const carregarCategorias = async () => {
    try {
      const cats = await api.getCategorias()
      setCategorias(cats)
    } catch (e) {
      console.error('Erro ao carregar categorias:', e)
    }
  }

  const carregarHistorico = async () => {
    const id = ++ultimaRequisicao.current
    try {
      setLoading(true)
      setError(null)
      const data = await api.getHistorico(
        userId,
        typeFilter !== 'Todos' ? typeFilter : undefined,
        posFilter !== 'Todos' ? posFilter : undefined
      )
      if (id !== ultimaRequisicao.current) return
      setHistorico(data)
    } catch (err: any) {
      if (id !== ultimaRequisicao.current) return
      console.error('Erro ao carregar histórico:', err)
      setError(err?.message || 'Falha ao buscar histórico no backend')
    } finally {
      if (id === ultimaRequisicao.current) setLoading(false)
    }
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  // Ao trocar de usuário, a busca anterior não faz mais sentido.
  useEffect(() => {
    setBusca('')
  }, [userId])

  useEffect(() => {
    carregarHistorico()
  }, [userId, posFilter, typeFilter])

  const resumo = historico?.resumo || {
    total_interacoes: user.total_interacoes,
    total_avaliacoes: user.total_avaliacoes,
    posicoes_top: [],
  }

  const itens = useMemo(() => historico?.itens ?? [], [historico])

  // Busca local: todos os termos digitados precisam aparecer em algum campo da linha.
  const itensFiltrados = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean)
    if (termos.length === 0) return itens
    return itens.filter((row: Interaction) => {
      const alvo = normalizar(
        [row.nome_perfil, row.id_item, row.clube, row.position, row.categoria, row.tipo_interacao || row.type].join(' ')
      )
      return termos.every(t => alvo.includes(t))
    })
  }, [itens, busca])

  const buscaAtiva = busca.trim().length > 0
  const filtrosAtivos = buscaAtiva || posFilter !== 'Todos' || typeFilter !== 'Todos'

  const limparTudo = () => {
    setBusca('')
    setPosFilter('Todos')
    setTypeFilter('Todos')
  }

  const topPosTexto =
    resumo.posicoes_top && resumo.posicoes_top.length > 0
      ? resumo.posicoes_top.map(p => `${p.rotulo} (${p.quantidade})`).join(' · ')
      : '—'

  return (
    <div style={{ padding: '32px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Histórico de Interações
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '0.85rem' }}>
            <span style={{ color: '#B08D57', fontWeight: 600 }}>{user.nome || user.name}</span>
            <span>·</span>
            <span>{user.clube || user.clube}</span>
            <span>·</span>
            <span>{user.papel || user.role}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({userId})</span>
          </div>
        </div>

        <button onClick={carregarHistorico} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
          {loading ? 'Atualizando...' : 'Recarregar'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total de Interações', value: resumo.total_interacoes, sub: 'registradas no backend', color: '#1F2A44' },
          { label: 'Avaliações', value: resumo.total_avaliacoes, sub: 'com nota técnica', color: '#B08D57' },
          { label: 'Posições Top', value: topPosTexto, sub: 'mais frequentes', color: '#1F2A44', isText: true },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ color: '#9ca3af', fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {c.label}
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: c.isText ? '0.95rem' : '1.8rem', color: c.color, lineHeight: 1.2, marginBottom: 4 }}>
              {c.value}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.73rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Busca + filtros */}
      <div
        className="card"
        style={{ marginBottom: 0, borderRadius: '10px 10px 0 0', padding: '14px 20px', borderBottom: '1px solid #e8e4da', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
      >
        {/* Campo de busca */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setBusca('')}
            placeholder="Buscar jogador, clube, posição ou tipo"
            aria-label="Buscar no histórico"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 32px 8px 32px',
              border: '1px solid #e8e4da',
              borderRadius: 8,
              background: '#fff',
              color: '#1F2A44',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          {buscaAtiva && (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <IconX />
            </button>
          )}
        </div>

        {/* Posição */}
        <select className="select-field" value={posFilter} onChange={e => setPosFilter(e.target.value)} aria-label="Filtrar por posição">
          <option value="Todos">Todas as posições</option>
          {categorias.map(c => (
            <option key={c.codigo} value={c.codigo}>
              {c.rotulo} ({c.codigo})
            </option>
          ))}
        </select>

        {filtrosAtivos && (
          <button onClick={limparTudo} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
            Limpar filtros
          </button>
        )}

        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '0.78rem' }} aria-live="polite">
          {buscaAtiva ? `${itensFiltrados.length} de ${itens.length} interações` : `${itens.length} interações`}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
        {loading && itens.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '1rem' }}>Carregando histórico do backend...</div>
          </div>
        ) : itens.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚽</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b7280' }}>Nenhuma interação encontrada</div>
            <div style={{ fontSize: '0.82rem' }}>
              {user.tem_historico
                ? 'Ajuste os filtros para ver resultados'
                : 'Este usuário está em cold-start e ainda não possui histórico registrado.'}
            </div>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b7280' }}>Nada encontrado para “{busca.trim()}”</div>
            <div style={{ fontSize: '0.82rem', marginBottom: 12 }}>Confira a grafia ou busque por clube, posição ou tipo de interação.</div>
            <button onClick={() => setBusca('')} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
              Limpar busca
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F3F1EC' }}>
                  {['Jogador', 'Clube', 'Posição', 'Nota', 'Data'].map(h => (
                    <th
                      key={h}
                      style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((row: Interaction) => (
                  <tr key={`${row.id_item}-${row.timestamp}`} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2C3D5E, #1F2A44)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#B08D57',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            fontFamily: 'Outfit, sans-serif',
                          }}
                        >
                          {(row.nome_perfil || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>{row.nome_perfil}</span>
                          <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>{row.id_item}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>{row.clube}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-navy">{row.position || row.categoria}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {row.nota ? <Stars value={row.nota} /> : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {row.date || row.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
