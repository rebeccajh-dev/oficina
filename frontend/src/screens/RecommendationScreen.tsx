import { useEffect, useRef, useState } from 'react'
import { PlayerCard } from '../components/PlayerCard'
import type { User } from '../interface/UserInterface'
import type { Player } from '../interface/PlayerInterface'
import type { CategoriaInfo, RecomendacoesResponse } from '../interface/ApiInterface'
import { api } from '../services/api'
import { IconInfo } from '../icons/icons'

// Quantas sugestões aparecem por vez.
const TAMANHO_PAGINA = 6

export function RecommendationsScreen({
  user,
  onEvaluate,
  onFeedbackSuccess,
}: {
  user: User
  onEvaluate: (p: Player) => void
  onFeedbackSuccess?: (msg: string) => void
}) {
  const userId = user.id_usuario || user.id

  const [categorias, setCategorias] = useState<CategoriaInfo[]>([])
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos')
  const [data, setData] = useState<RecomendacoesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discardingId, setDiscardingId] = useState<string | null>(null)

  // Navegação pelo ranking: página 0 = 1º ao 6º, página 1 = 7º ao 12º, ...
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(true)
  const [avisoFim, setAvisoFim] = useState(false)

  // Evita que uma resposta antiga sobrescreva a mais recente.
  const ultimaRequisicao = useRef(0)

  const carregarCategorias = async () => {
    try {
      const cats = await api.getCategorias()
      setCategorias(cats)
    } catch (e) {
      console.error('Erro ao carregar categorias:', e)
    }
  }

  const carregarRecomendacoes = async () => {
    const id = ++ultimaRequisicao.current
    try {
      setLoading(true)
      setError(null)

      // Pede o ranking até o fim da página atual e exibe só a última fatia.
      const resp = await api.getRecomendacoes(
        userId,
        selectedCategoria !== 'Todos' ? selectedCategoria : undefined,
        TAMANHO_PAGINA * (pagina + 1)
      )
      if (id !== ultimaRequisicao.current) return

      const fatia = resp.recomendacoes.slice(pagina * TAMANHO_PAGINA)

      // Acabaram os candidatos: volta ao início (o efeito abaixo recarrega a página 0).
      if (pagina > 0 && fatia.length === 0) {
        setAvisoFim(true)
        setPagina(0)
        return
      }

      setTemMais(resp.recomendacoes.length >= TAMANHO_PAGINA * (pagina + 1))
      setData({ ...resp, recomendacoes: fatia })
    } catch (err: any) {
      if (id !== ultimaRequisicao.current) return
      console.error('Erro ao carregar recomendações:', err)
      setError(err?.message || 'Falha ao buscar recomendações no backend')
    } finally {
      if (id === ultimaRequisicao.current) setLoading(false)
    }
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  // Trocar de usuário ou de posição reinicia a navegação.
  useEffect(() => {
    setPagina(0)
    setAvisoFim(false)
  }, [userId, selectedCategoria])

  useEffect(() => {
    carregarRecomendacoes()
  }, [userId, selectedCategoria, pagina])

  const verOutras = () => {
    if (temMais) {
      setAvisoFim(false)
      setPagina(p => p + 1)
      return
    }
    // Fim da lista: volta ao início (ou só recarrega, se já estiver na página 0).
    setAvisoFim(pagina > 0)
    if (pagina === 0) carregarRecomendacoes()
    else setPagina(0)
  }

  const handleDiscard = async (idItem: string) => {
    try {
      setDiscardingId(idItem)
      const p = data?.recomendacoes.find(r => (r.id_item || r.id) === idItem)
      const nome = p?.nome_perfil || p?.name || 'Jogador'

      // Envia evento 'descartou' para o backend
      await api.registrarInteracao(userId, idItem, 'descartou')

      if (onFeedbackSuccess) {
        onFeedbackSuccess(`${nome} descartado com sucesso. O modelo foi recalculado!`)
      }

      // Recarrega na hora: o descartado sai do ranking e o próximo ocupa a vaga.
      await carregarRecomendacoes()
    } catch (err: any) {
      console.error('Erro ao descartar jogador:', err)
      alert(`Erro ao descartar: ${err.message}`)
    } finally {
      setDiscardingId(null)
    }
  }

  const isColdStart = data ? !data.personalizada : !user.tem_historico
  const avisoColdStart =
    data?.aviso ||
    (isColdStart
      ? 'Recomendações baseadas em popularidade. Interaja com jogadores para personalizar suas sugestões e ativar a filtragem colaborativa.'
      : null)
  const players = data?.recomendacoes || []
  const inicio = pagina * TAMANHO_PAGINA

  const rotuloBotao = loading
    ? 'Calculando...'
    : temMais
      ? 'Ver outras sugestões'
      : pagina > 0
        ? 'Voltar ao início'
        : 'Recalcular'

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1F2A44', marginBottom: 4 }}>
            Recomendações
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {isColdStart
              ? 'Jogadores mais populares na plataforma (modo cold-start)'
              : `Top recomendações personalizadas para ${user.nome || user.name} (${user.clube || user.club})`}
          </p>
        </div>

        <button
          onClick={verOutras}
          disabled={loading}
          className="btn-outline"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
        >
          {rotuloBotao}
        </button>
      </div>

      {/* Cold-start banner */}
      {isColdStart && avisoColdStart && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'rgba(176, 141, 87, 0.08)', border: '1px solid rgba(176, 141, 87, 0.3)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 24,
        }}>
          <div style={{ color: '#B08D57', marginTop: 1, flexShrink: 0 }}>
            <IconInfo />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#8F6E3E', marginBottom: 2 }}>
              Recomendações baseadas em popularidade (Cold-start)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#92794a' }}>
              {avisoColdStart}
            </div>
          </div>
        </div>
      )}

      {/* Fim da lista */}
      {avisoFim && (
        <div style={{ background: '#F3F1EC', border: '1px solid #e8e4da', borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: '#6b7280', fontSize: '0.82rem' }}>
          Você já viu todas as sugestões disponíveis para este filtro. Voltamos ao início da lista.
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '14px 18px', marginBottom: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Gap position filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 18, background: '#B08D57', borderRadius: 2 }} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2A44' }}>
              Gap por Posição
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              className={`chip ${selectedCategoria === 'Todos' ? 'active' : ''}`}
              onClick={() => setSelectedCategoria('Todos')}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.codigo}
                className={`chip ${selectedCategoria === cat.codigo ? 'active' : ''}`}
                onClick={() => setSelectedCategoria(cat.codigo)}
              >
                {cat.rotulo} ({cat.codigo})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontWeight: 600, color: '#1F2A44', fontSize: '0.9rem' }}>
            {selectedCategoria === 'Todos' ? 'Todas as posições' : (categorias.find(c => c.codigo === selectedCategoria)?.rotulo || selectedCategoria)}
            {' · '}
            {players.length > 0 ? `Sugestões ${inicio + 1}–${inicio + players.length}` : 'Sem sugestões'}
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 6 }}>
            jogadores recomendados pelo modelo
          </span>
        </div>

        {!isColdStart && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F1EC', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', color: '#6b7280' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#B08D57"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Filtragem colaborativa item-based ativa
          </span>
        )}
      </div>

      {/* Player grid */}
      {loading && players.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '20px', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8e4da', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '50%', height: 14, background: '#e8e4da', borderRadius: 4 }} />
              <div style={{ width: '30%', height: 10, background: '#f0ece4', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : players.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
          {players.map(p => (
            <PlayerCard
              key={p.id_item || p.id}
              player={p}
              isColdStart={isColdStart}
              onEvaluate={onEvaluate}
              onDiscard={handleDiscard}
              isDiscarding={discardingId === (p.id_item || p.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.75rem' }}>
            ⚽
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#1F2A44', marginBottom: 6 }}>
            Sem recomendações nesta posição
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: 360, margin: '0 auto' }}>
            {isColdStart
              ? 'Nenhum jogador popular disponível para esta posição no momento.'
              : 'O modelo já esgotou os candidatos ou o elenco do clube já possui esses jogadores. Experimente outro gap de posição.'}
          </div>
        </div>
      )}
    </div>
  )
}
