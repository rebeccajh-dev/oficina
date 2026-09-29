import type {
  Categoria,
  CategoriaInfo,
  FeedbackResponse,
  HistoricoResponse,
  Interaction,
  MetricasResponse,
  Player,
  RecomendacoesResponse,
  TipoInteracao,
  TipoNoHistorico,
  User,
} from '../interface/ApiInterface'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const CATEGORIA_ROTULOS: Record<string, string> = {
  GK: 'Goleiro',
  DF: 'Defensor',
  MF: 'Meio-campista',
  FW: 'Atacante',
}

export function extrairIniciais(nome: string): string {
  if (!nome) return '??'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function formatarData(dataStr?: string): string {
  if (!dataStr) return '—'
  try {
    const d = new Date(dataStr)
    if (isNaN(d.getTime())) return dataStr
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dataStr
  }
}

export function normalizarUsuario(u: any): User {
  const nome = u.nome || u.name || ''
  const id_usuario = u.id_usuario || String(u.id || '')
  return {
    ...u,
    id_usuario,
    nome,
    papel: u.papel || u.role || 'Scout',
    clube: u.clube || u.club || 'Clube',
    perfil_teste: Boolean(u.perfil_teste),
    total_interacoes: Number(u.total_interacoes ?? 0),
    total_avaliacoes: Number(u.total_avaliacoes ?? 0),
    tem_historico: Boolean(u.tem_historico ?? u.hasHistory),
    cold_start: Boolean(u.cold_start ?? !u.tem_historico),

    // Aliases
    id: id_usuario,
    name: nome,
    role: u.papel || u.role || 'Scout',
    club: u.clube || u.club || 'Clube',
    hasHistory: Boolean(u.tem_historico ?? u.hasHistory),
    initials: u.initials || extrairIniciais(nome),
  }
}

export function normalizarPlayer(p: any): Player {
  const nome_perfil = p.nome_perfil || p.name || ''
  const id_item = p.id_item || String(p.id || '')
  const categoria = p.categoria || p.positionKey || 'MF'
  const score_pct = Math.round(p.score_pct ?? p.affinity ?? Math.round((p.score ?? 0) * 100))
  const posLabel = CATEGORIA_ROTULOS[categoria] || p.position || categoria

  return {
    ...p,
    id_item,
    nome_perfil,
    categoria,
    posicoes: Array.isArray(p.posicoes) && p.posicoes.length > 0 ? p.posicoes : [categoria],
    clube: p.clube || p.club || '—',
    liga: p.liga || '—',
    nacionalidade: p.nacionalidade || '—',
    idade: Number(p.idade ?? 22),
    score: Number(p.score ?? 0),
    score_pct,
    origem: p.origem || (p.popular ? 'popularidade' : 'colaborativa'),

    // Aliases
    id: id_item,
    name: nome_perfil,
    initials: p.initials || extrairIniciais(nome_perfil),
    position: posLabel,
    positionKey: categoria,
    affinity: score_pct,
    popular: (p.origem === 'popularidade') || Boolean(p.popular),
  }
}

export function normalizarInteracao(i: any): Interaction {
  const id_item = i.id_item || String(i.id || '')
  const nome_perfil = i.nome_perfil || i.player || ''
  const categoria = i.categoria || i.positionKey || 'MF'
  const tipo = (i.tipo_interacao || i.type || 'visualizou') as TipoNoHistorico

  return {
    ...i,
    id_item,
    nome_perfil,
    categoria,
    posicoes: Array.isArray(i.posicoes) && i.posicoes.length > 0 ? i.posicoes : [categoria],
    clube: i.clube || i.club || '—',
    tipo_interacao: tipo,
    nota: i.nota ?? i.note ?? null,
    timestamp: i.timestamp || new Date().toISOString(),

    // Aliases
    id: id_item,
    player: nome_perfil,
    position: CATEGORIA_ROTULOS[categoria] || i.position || categoria,
    positionKey: categoria,
    type: tipo,
    note: i.nota ?? i.note ?? null,
    date: formatarData(i.timestamp || i.date),
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`
    try {
      const errJson = await response.json()
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return response.json()
}

export const api = {
  async health(): Promise<{ status: string }> {
    return request<{ status: string }>('/health')
  },

  async getCategorias(): Promise<CategoriaInfo[]> {
    return request<CategoriaInfo[]>('/categorias')
  },

  async getUsuarios(busca?: string, incluirComunidade: boolean = false): Promise<User[]> {
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (incluirComunidade) params.set('incluir_comunidade', 'true')
    const qs = params.toString() ? `?${params.toString()}` : ''
    const dados = await request<any[]>(`/usuarios${qs}`)
    return dados.map(normalizarUsuario)
  },

  async getUsuario(idUsuario: string): Promise<User> {
    const dados = await request<any>(`/usuarios/${idUsuario}`)
    return normalizarUsuario(dados)
  },

  async getHistorico(
    idUsuario: string,
    tipo?: string,
    categoria?: string
  ): Promise<HistoricoResponse> {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'Todos') params.set('tipo', tipo)
    if (categoria && categoria !== 'Todos') params.set('categoria', categoria)
    const qs = params.toString() ? `?${params.toString()}` : ''

    const resp = await request<any>(`/usuarios/${idUsuario}/historico${qs}`)
    return {
      usuario: normalizarUsuario(resp.usuario),
      resumo: resp.resumo || { total_interacoes: 0, total_avaliacoes: 0, posicoes_top: [] },
      total_filtrado: resp.total_filtrado ?? (resp.itens?.length || 0),
      itens: (resp.itens || []).map(normalizarInteracao),
    }
  },

  async getRecomendacoes(
    idUsuario: string,
    categoria?: string,
    n: number = 5
  ): Promise<RecomendacoesResponse> {
    const params = new URLSearchParams()
    if (categoria && categoria !== 'Todos') params.set('categoria', categoria)
    params.set('n', String(n))
    const qs = `?${params.toString()}`

    const resp = await request<any>(`/usuarios/${idUsuario}/recomendacoes${qs}`)
    return {
      id_usuario: resp.id_usuario,
      categoria: resp.categoria,
      n_solicitado: resp.n_solicitado,
      personalizada: resp.personalizada,
      aviso: resp.aviso,
      recomendacoes: (resp.recomendacoes || []).map(normalizarPlayer),
    }
  },

  async registrarAvaliacao(
    idUsuario: string,
    idItem: string,
    nota: number,
    comentario?: string
  ): Promise<FeedbackResponse> {
    const body: Record<string, any> = {
      id_usuario: idUsuario,
      id_item: idItem,
      nota,
    }
    if (comentario && comentario.trim()) {
      body.comentario = comentario.trim()
    }

    const resp = await request<any>('/avaliacoes', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return {
      ...resp,
      usuario: normalizarUsuario(resp.usuario),
    }
  },

  async registrarInteracao(
    idUsuario: string,
    idItem: string,
    tipoInteracao: TipoInteracao
  ): Promise<FeedbackResponse> {
    const resp = await request<any>('/interacoes', {
      method: 'POST',
      body: JSON.stringify({
        id_usuario: idUsuario,
        id_item: idItem,
        tipo_interacao: tipoInteracao,
      }),
    })

    return {
      ...resp,
      usuario: normalizarUsuario(resp.usuario),
    }
  },

  async getMetricas(k: number = 5): Promise<MetricasResponse> {
    return request<MetricasResponse>(`/metricas?k=${k}`)
  },
}
