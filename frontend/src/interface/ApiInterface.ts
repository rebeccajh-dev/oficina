export type Categoria = 'GK' | 'DF' | 'MF' | 'FW'
export type TipoInteracao = 'visualizou' | 'selecionou' | 'favoritou' | 'descartou'
export type TipoNoHistorico = TipoInteracao | 'avaliou'

export interface CategoriaInfo {
  codigo: Categoria
  rotulo: string
}

export interface User {
  id_usuario: string
  nome: string
  papel: string
  clube: string
  perfil_teste: boolean
  total_interacoes: number
  total_avaliacoes: number
  tem_historico: boolean
  cold_start: boolean

  // Aliases para conveniência
  id: string
  name: string
  role: string
  hasHistory: boolean
  initials: string
}

export interface Player {
  id_item: string
  nome_perfil: string
  categoria: Categoria | string
  posicoes: (Categoria | string)[]
  clube: string
  liga: string
  nacionalidade: string
  idade: number
  score: number
  score_pct: number
  origem: 'colaborativa' | 'popularidade'

  // Aliases para conveniência
  id: string
  name: string
  initials: string
  position: string
  positionKey: string
  affinity: number
  popular?: boolean
}

export interface Interaction {
  id_item: string
  nome_perfil: string
  categoria: Categoria | string
  posicoes: (Categoria | string)[]
  clube: string
  tipo_interacao: TipoNoHistorico
  nota: number | null
  timestamp: string

  // Aliases para conveniência
  id: string
  player: string
  position: string
  positionKey: string
  type: TipoNoHistorico
  note?: number | null
  date: string
}

export interface HistoricoResponse {
  usuario: User
  resumo: {
    total_interacoes: number
    total_avaliacoes: number
    posicoes_top: { categoria: Categoria; rotulo: string; quantidade: number }[]
  }
  total_filtrado: number
  itens: Interaction[]
}

export interface RecomendacoesResponse {
  id_usuario: string
  categoria: Categoria | null
  n_solicitado: number
  personalizada: boolean
  aviso: string | null
  recomendacoes: Player[]
}

export interface FeedbackResponse {
  id_usuario: string
  id_item: string
  tipo_interacao: TipoNoHistorico
  nota: number | null
  valor_interesse: number
  usuario: User
}

export interface MetricaUsuario {
  id_usuario: string
  usuario: string
  clube: string
  papel?: string
  interacoes: number
  relevantes: number
  acertos: number
  precisao: number
  recall: number
}

export interface MetricasResponse {
  k: number
  precisao_media: number
  recall_medio: number
  map: number
  mrr: number
  ndcg: number
  r2: number
  r2_calibrado: number
  pearson: number
  spearman: number
  kendall_tau: number
  pares_correlacao: number
  usuarios_ativos: number
  total_usuarios: number
  total_interacoes: number
  por_usuario: {
    id_usuario: string
    usuario: string
    clube: string
    papel: string
    interacoes: number
    relevantes: number
    acertos: number
    precisao: number
    recall: number
    rr: number
    ap: number
    ndcg: number
  }[]
}
