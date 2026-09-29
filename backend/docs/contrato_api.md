# Contrato da API (para o frontend React + TypeScript)

Base: `http://localhost:8000` · Docs interativas: `/docs` · CORS liberado para `localhost:5173` e `localhost:3000`
(outras origens: variável de ambiente `CORS_ORIGENS`, separadas por vírgula).

Erros: `404 { "detail": "..." }` (usuário/jogador/categoria inexistente) e `422` (valor inválido, ex.: nota 9).

## Tipos

```ts
export type Categoria = "GK" | "DF" | "MF" | "FW";
export type TipoInteracao = "visualizou" | "selecionou" | "favoritou" | "descartou";
export type TipoNoHistorico = TipoInteracao | "avaliou"; // "avaliou" = só nota, sem outro evento

export interface CategoriaInfo { codigo: Categoria; rotulo: string }   // "Goleiro", "Defensor", "Meio-campista", "Atacante"

export interface Usuario {
  id_usuario: string; nome: string; papel: string; clube: string;
  perfil_teste: boolean;
  total_interacoes: number; total_avaliacoes: number;
  tem_historico: boolean; cold_start: boolean;   // cold_start = !tem_historico
}

export interface ItemHistorico {
  id_item: string; nome_perfil: string; categoria: Categoria; posicoes: Categoria[]; clube: string;
  tipo_interacao: TipoNoHistorico; nota: number | null; timestamp: string; // ISO
}
export interface Historico {
  usuario: Usuario;
  resumo: { total_interacoes: number; total_avaliacoes: number;
            posicoes_top: { categoria: Categoria; rotulo: string; quantidade: number }[] }; // sempre do histórico inteiro
  total_filtrado: number;      // "N resultados" da lista, já com filtros
  itens: ItemHistorico[];      // mais recentes primeiro
}

export interface Recomendacao {
  id_item: string; nome_perfil: string; categoria: Categoria; posicoes: Categoria[];
  clube: string; liga: string; nacionalidade: string; idade: number;
  score: number;
  score_pct: number;                       // 0-100, use na barra (POPULARIDADE / AFINIDADE)
  origem: "colaborativa" | "popularidade"; // "popularidade" => selo POPULAR
}
export interface Recomendacoes {
  id_usuario: string; categoria: Categoria | null; n_solicitado: number;
  personalizada: boolean;      // false => mostrar o aviso de popularidade
  aviso: string | null;
  recomendacoes: Recomendacao[];
}

export interface Feedback {   // resposta dos POST
  id_usuario: string; id_item: string; tipo_interacao: TipoNoHistorico; nota: number | null;
  valor_interesse: number; usuario: Usuario; // usuário já atualizado (ex.: saiu do cold-start)
}
```

## Endpoints

| Método | Rota | Uso na tela |
|---|---|---|
| GET | `/categorias` | Chips do "Gap por Posição" (`CategoriaInfo[]`) |
| GET | `/usuarios?busca=&incluir_comunidade=false` | Seleção de usuário (`Usuario[]`); `busca` filtra nome/clube |
| GET | `/usuarios/{id}` | Usuário ativo (`Usuario`) |
| GET | `/usuarios/{id}/historico?tipo=&categoria=` | Histórico (`Historico`) |
| GET | `/usuarios/{id}/recomendacoes?categoria=MF&n=5` | Recomendações (`Recomendacoes`) |
| POST | `/avaliacoes` `{id_usuario, id_item, nota (1-5), comentario?}` | Botão **Avaliar** (`Feedback`, 201) |
| POST | `/interacoes` `{id_usuario, id_item, tipo_interacao}` | Botão **Descartar** (`"descartou"`) e favoritar/selecionar/visualizar (`Feedback`, 201) |

## Pontos de atenção

- **Categorias são 4** (GK, DF, MF, FW), a granularidade do dataset. As telas atuais têm 6 chips
  (Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante): o dataset não distingue zagueiro de lateral
  nem volante de meia. Renderize os chips a partir de `GET /categorias`.
- Jogador multiposição ("MF,FW") aparece nos filtros de todas as suas posições.
- Depois de qualquer POST, rebusque as recomendações: o modelo é recalculado na hora e o jogador
  avaliado/descartado deixa de ser sugerido.
- `GET /usuarios` devolve só os 5 usuários de teste por padrão (a base tem ~200 simulados).
- Cada `GET .../recomendacoes` é gravado em `recomendacoes_log.json` (usado nas métricas).
- A tela **Métricas** depende do passo 6 (endpoint ainda não existe).
