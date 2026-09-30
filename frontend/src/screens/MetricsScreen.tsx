import { useEffect, useState } from 'react'
import type { MetricasResponse } from '../interface/ApiInterface'
import { api } from '../services/api'

const K = 5

type ChaveKpi =
  | 'precisao_media'
  | 'recall_medio'
  | 'map'
  | 'mrr'
  | 'ndcg'
  | 'r2'
  | 'pearson'
  | 'spearman'
  | 'kendall_tau'

interface KpiDef {
  chave: ChaveKpi
  titulo: string
  descricao: string
}

const KPIS_RANKING: KpiDef[] = [
  { chave: 'precisao_media', titulo: `Precision@${K} Médio`, descricao: `acertos nos top-${K} ÷ ${K}` },
  { chave: 'recall_medio', titulo: `Recall@${K} Médio`, descricao: 'cobertura dos itens relevantes' },
  { chave: 'map', titulo: `MAP@${K}`, descricao: 'precisão média nas posições dos acertos' },
  { chave: 'mrr', titulo: 'MRR', descricao: 'inverso da posição do 1º acerto' },
  { chave: 'ndcg', titulo: `NDCG@${K}`, descricao: 'acertos no topo valem mais' },
]

const KPIS_CORRELACAO: KpiDef[] = [
  { chave: 'r2', titulo: 'Pontuação R²', descricao: 'ajuste do score ao interesse real' },
  { chave: 'pearson', titulo: 'Pearson', descricao: 'correlação linear score × interesse' },
  { chave: 'spearman', titulo: 'Spearman', descricao: 'correlação de postos (ordem)' },
  { chave: 'kendall_tau', titulo: 'Kendall Tau', descricao: 'concordância entre pares' },
]

const LEGENDA: [string, string][] = [
  [`Precision@${K}`, `acertos no top-${K} ÷ ${K}`],
  [`Recall@${K}`, `acertos no top-${K} ÷ total de itens relevantes no teste`],
  [`MAP@${K}`, 'média das precisões nas posições em que houve acerto'],
  ['MRR', '1 ÷ posição do primeiro acerto'],
  [`NDCG@${K}`, 'ganho descontado pela posição, normalizado pelo ideal'],
  ['N/A', 'métrica não se aplica (sem histórico suficiente ou sem itens relevantes no teste)'],
]

const fmt = (v?: number | null) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '—')

const gridKpis: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 14,
  marginBottom: 28,
}

function TituloSecao({ texto, subtitulo }: { texto: string; subtitulo?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 18, background: '#B08D57', borderRadius: 2 }} />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1F2A44' }}>
          {texto}
        </span>
      </div>
      {subtitulo && <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: '4px 0 0 11px' }}>{subtitulo}</p>}
    </div>
  )
}

function KpiCard({
  def,
  valor,
  loading,
  extra,
}: {
  def: KpiDef
  valor?: number | null
  loading: boolean
  extra?: string
}) {
  const negativo = typeof valor === 'number' && valor < 0
  return (
    <div className="metric-card">
      <div
        style={{
          color: '#8a9ab8',
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        {def.titulo}
      </div>
      <div
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '2.4rem',
          color: negativo ? '#b91c1c' : '#B08D57',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {loading ? '—' : fmt(valor)}
      </div>
      <div style={{ color: '#5a6a87', fontSize: '0.75rem' }}>{def.descricao}</div>
      {extra && !loading && <div style={{ color: '#8a9ab8', fontSize: '0.7rem', marginTop: 4 }}>{extra}</div>}
    </div>
  )
}

// N/A quando o valor é null/undefined (métrica não se aplica).
// Zero é um valor real: o modelo errou tudo, e continua aparecendo como 0,00.
function BarCell({ valor, cor, motivo }: { valor?: number | null; cor: string; motivo?: string }) {
  if (valor == null) {
    return (
      <span title={motivo} style={{ color: '#d1d5db', fontSize: '0.8rem', cursor: motivo ? 'help' : 'default' }}>
        N/A
      </span>
    )
  }
  const v = valor
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 50, height: 5, borderRadius: 3, background: '#e8e4da', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, v * 100))}%`, background: cor, borderRadius: 3 }} />
      </div>
      <span style={{ fontWeight: 600, color: v >= 0.8 ? '#15803d' : v >= 0.4 ? cor : '#b91c1c', fontSize: '0.82rem' }}>
        {fmt(v)}
      </span>
    </div>
  )
}

export function MetricsScreen() {
  const [data, setData] = useState<MetricasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarMetricas = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getMetricas(K)
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

  const metricasPorUsuario = data?.por_usuario || []
  const colunas = [
    'Usuário',
    'Clube',
    'Interações',
    'Itens Relevantes',
    `Acertos@${K}`,
    `Precision@${K}`,
    `Recall@${K}`,
    `MAP@${K}`,
    'MRR',
    `NDCG@${K}`,
  ]

  return (
    <div style={{ padding: '32px 28px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Métricas do Sistema
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Avaliação de desempenho da filtragem colaborativa sobre o split de teste reservado · Passo 6
          </p>
        </div>

        <button onClick={carregarMetricas} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
          {loading ? 'Calculando...' : 'Recalcular Métricas'}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* KPIs de ranking */}
      <TituloSecao
        texto="Qualidade do ranking"
        subtitulo={
          data
            ? `Avalia se os itens relevantes aparecem no top-${K} · média sobre ${data.usuarios_avaliados ?? 0} de ${data.total_usuarios ?? 0} usuários (só entram quem tem histórico e itens relevantes no teste)`
            : `Avalia se os itens relevantes aparecem no top-${K} recomendado`
        }
      />
      <div style={gridKpis}>
        {KPIS_RANKING.map(def => (
          <KpiCard key={def.chave} def={def} valor={data?.[def.chave]} loading={loading} />
        ))}
      </div>

      {/* KPIs de correlação */}
      <TituloSecao
        texto="Score previsto × interesse real"
        subtitulo={
          data
            ? `Calculado sobre ${data.pares_correlacao ?? 0} pares (score, interesse) do holdout`
            : 'Compara o score do modelo com o interesse real dos itens de teste'
        }
      />
      <div style={gridKpis}>
        {KPIS_CORRELACAO.map(def => (
          <KpiCard
            key={def.chave}
            def={def}
            valor={data?.[def.chave]}
            loading={loading}
            extra={def.chave === 'r2' && data ? `R² calibrado: ${fmt(data.r2_calibrado)}` : undefined}
          />
        ))}
      </div>

      {data && typeof data.r2 === 'number' && data.r2 < 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 28,
            color: '#92400e',
            fontSize: '0.78rem',
          }}
        >
          O R² negativo é esperado: o score do modelo tem escala diferente do interesse (0 a 1). O R² calibrado, que
          ajusta a escala, e as correlações mostram se o score acompanha o interesse real.
        </div>
      )}

      {/* Tabela por usuário */}
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
                {colunas.map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricasPorUsuario.map((m, i) => {
                // `ativo` agora só controla o visual do avatar; o N/A das métricas vem do valor (null)
                const ativo = m.interacoes > 0
                const motivo =
                  m.tem_historico === false ? 'Sem histórico suficiente para recomendar' : 'Sem itens relevantes no teste'
                return (
                  <tr key={m.id_usuario || i} className="table-row" style={{ borderTop: '1px solid #f0ece4' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: ativo ? 'linear-gradient(135deg, #2C3D5E, #1F2A44)' : '#e8e4da',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: ativo ? '#B08D57' : '#9ca3af',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            fontFamily: 'Outfit, sans-serif',
                          }}
                        >
                          {m.usuario.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>{m.usuario}</span>
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                            {m.id_usuario}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.82rem' }}>{m.clube}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#1F2A44' }}>{m.interacoes}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>{m.relevantes}</td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.85rem' }}>{m.acertos}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarCell valor={m.precisao} cor="#B08D57" motivo={motivo} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarCell valor={m.recall} cor="#1F2A44" motivo={motivo} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarCell valor={m.ap} cor="#B08D57" motivo={motivo} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarCell valor={m.rr} cor="#1F2A44" motivo={motivo} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarCell valor={m.ndcg} cor="#B08D57" motivo={motivo} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: '12px 20px',
            background: '#F3F1EC',
            borderTop: '1px solid #e8e4da',
            display: 'flex',
            gap: '8px 24px',
            flexWrap: 'wrap',
          }}
        >
          {LEGENDA.map(([nome, def]) => (
            <div key={nome} style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              <span style={{ fontWeight: 700, color: '#1F2A44' }}>{nome}</span> = {def}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
