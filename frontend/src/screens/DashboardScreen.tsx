import { useEffect, useState } from 'react'
import { InteractionBadge, Stars } from '../components/InteractionBadge'
import { IconX } from '../icons/icons'
import type { User } from '../interface/UserInterface'
import type { Interaction } from '../interface/InteractionInterface'
import type { CategoriaInfo, HistoricoResponse } from '../interface/ApiInterface'
import { api } from '../services/api'

export function DashboardScreen({ user }: { user: User }) {
  const [posFilter, setPosFilter] = useState('Todos')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [categorias, setCategorias] = useState<CategoriaInfo[]>([])
  const [historico, setHistorico] = useState<HistoricoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarCategorias = async () => {
    try {
      const cats = await api.getCategorias()
      setCategorias(cats)
    } catch (e) {
      console.error('Erro ao carregar categorias:', e)
    }
  }

  const carregarHistorico = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getHistorico(
        user.id_usuario || user.id,
        typeFilter !== 'Todos' ? typeFilter : undefined,
        posFilter !== 'Todos' ? posFilter : undefined
      )
      setHistorico(data)
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err)
      setError(err?.message || 'Falha ao buscar histórico no backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  useEffect(() => {
    carregarHistorico()
  }, [user.id_usuario || user.id, posFilter, typeFilter])

  const resumo = historico?.resumo || {
    total_interacoes: user.total_interacoes,
    total_avaliacoes: user.total_avaliacoes,
    posicoes_top: [],
  }

  const itens = historico?.itens || []
  const topPosTexto = resumo.posicoes_top && resumo.posicoes_top.length > 0
    ? resumo.posicoes_top.map(p => `${p.rotulo} (${p.quantidade})`).join(' · ')
    : '—'

  const tiposInteracaoOpcoes = ['Todos', 'visualizou', 'selecionou', 'favoritou', 'descartou', 'avaliou']

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
            <span>{user.clube || user.club}</span>
            <span>·</span>
            <span>{user.papel || user.role}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({user.id_usuario || user.id})</span>
          </div>
        </div>

        <button
          onClick={carregarHistorico}
          className="btn-outline"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
        >
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

      {/* Filters */}
      <div className="card" style={{ marginBottom: 0, borderRadius: '10px 10px 0 0', padding: '14px 20px', borderBottom: '1px solid #e8e4da', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>Filtrar por:</span>

        {/* Posição */}
        <div style={{ position: 'relative' }}>
          <select className="select-field" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
            <option value="Todos">Todas as posições</option>
            {categorias.map(c => (
              <option key={c.codigo} value={c.codigo}>{c.rotulo} ({c.codigo})</option>
            ))}
          </select>
        </div>

        {/* Tipo de Interação */}
        <div style={{ position: 'relative' }}>
          <select className="select-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {tiposInteracaoOpcoes.map(t => (
              <option key={t} value={t}>{t === 'Todos' ? 'Todos os eventos' : t}</option>
            ))}
          </select>
        </div>

        {(posFilter !== 'Todos' || typeFilter !== 'Todos') && (
          <button
            onClick={() => { setPosFilter('Todos'); setTypeFilter('Todos') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B08D57', fontSize: '0.78rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <IconX />Limpar filtros
          </button>
        )}

        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '0.78rem' }}>
          {loading ? 'Carregando...' : `${itens.length} resultado${itens.length !== 1 ? 's' : ''}`}
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
              {user.tem_historico ? 'Ajuste os filtros para ver resultados' : 'Este usuário está em cold-start e ainda não possui histórico registrado.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F3F1EC' }}>
                  {['Jogador', 'Clube', 'Posição', 'Tipo de Interação', 'Nota', 'Data'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((row: Interaction) => (
                  <tr key={`${row.id_item}-${row.timestamp}`} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2C3D5E, #1F2A44)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#B08D57', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                          fontFamily: 'Outfit, sans-serif',
                        }}>
                          {row.nome_perfil.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>
                            {row.nome_perfil}
                          </span>
                          <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                            {row.id_item}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>
                      {row.clube}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-navy">
                        {row.position || row.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <InteractionBadge type={row.tipo_interacao || row.type} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {row.nota ? <Stars value={row.nota} /> : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {row.date}
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