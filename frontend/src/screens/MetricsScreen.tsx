import { useEffect, useState } from 'react'
import type { MetricasResponse } from '../interface/ApiInterface'
import { api } from '../services/api'

export function MetricsScreen() {
  const [data, setData] = useState<MetricasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarMetricas = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getMetricas(5)
      setData(res)
    } catch (err: any) {
      console.error('Erro ao carregar métricas:', err)
      setError(err?.message || 'Falha ao buscar métricas no backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarMetricas()
  }, [])

  const avgPrecision = data ? data.precisao_media.toFixed(2) : '0.00'
  const avgRecall = data ? data.recall_medio.toFixed(2) : '0.00'
  const activeUsers = data ? data.usuarios_ativos : 0
  const totalInteractions = data ? data.total_interacoes : 0
  const metricasPorUsuario = data?.por_usuario || []

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Métricas do Sistema
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Avaliação de desempenho da filtragem colaborativa sobre o split de teste reservado · Passo 6
          </p>
        </div>

        <button
          onClick={carregarMetricas}
          className="btn-outline"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
        >
          {loading ? 'Calculando...' : 'Recalcular Métricas'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Precision@5 Médio
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>
            {loading ? '—' : avgPrecision}
          </div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>
            acertos nos top-5 / usuários com teste
          </div>
        </div>

        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Recall@5 Médio
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>
            {loading ? '—' : avgRecall}
          </div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>
            cobertura dos itens relevantes
          </div>
        </div>

        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Usuários Ativos
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>
            {loading ? '—' : activeUsers}
          </div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>
            com histórico suficiente (≥ 3)
          </div>
        </div>

        <div className="metric-card">
          <div style={{ color: '#8a9ab8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Total Interações
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#B08D57', lineHeight: 1, marginBottom: 4 }}>
            {loading ? '—' : totalInteractions.toLocaleString('pt-BR')}
          </div>
          <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>
            persistidas na base de dados
          </div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 18, background: '#B08D57', borderRadius: 2 }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1F2A44' }}>
            Comparativo por Usuário de Teste
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F3F1EC' }}>
                {['Usuário', 'Clube', 'Interações', 'Itens Relevantes', 'Acertos@5', 'Precision@5', 'Recall@5'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricasPorUsuario.map((m, i) => (
                <tr key={m.id_usuario || i} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: m.interacoes > 0 ? 'linear-gradient(135deg, #2C3D5E, #1F2A44)' : '#e8e4da',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: m.interacoes > 0 ? '#B08D57' : '#9ca3af',
                        fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                        fontFamily: 'Outfit, sans-serif',
                      }}>
                        {m.usuario.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>
                          {m.usuario}
                        </span>
                        <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                          {m.id_usuario}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>
                    {m.clube}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#1F2A44' }}>
                      {m.interacoes}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>
                    {m.relevantes}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>
                    {m.acertos}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.interacoes > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 5, borderRadius: 3, background: '#e8e4da', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, m.precisao * 100)}%`, background: '#B08D57', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 600, color: m.precisao >= 0.8 ? '#15803d' : m.precisao >= 0.4 ? '#B08D57' : '#b91c1c', fontSize: '0.82rem' }}>
                          {m.precisao.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.interacoes > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 5, borderRadius: 3, background: '#e8e4da', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, m.recall * 100)}%`, background: '#1F2A44', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 600, color: m.recall >= 0.8 ? '#15803d' : m.recall >= 0.4 ? '#1F2A44' : '#b91c1c', fontSize: '0.82rem' }}>
                          {m.recall.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px', background: '#F3F1EC', borderTop: '1px solid #e8e4da', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            <span style={{ fontWeight: 700, color: '#1F2A44' }}>Precision@5</span> = acertos no top-5 ÷ 5
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            <span style={{ fontWeight: 700, color: '#1F2A44' }}>Recall@5</span> = acertos no top-5 ÷ total de itens relevantes no teste
          </div>
        </div>
      </div>
    </div>
  )
}