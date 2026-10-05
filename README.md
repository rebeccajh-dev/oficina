# Sistema de Recomendação de Jogadores (Scouting Inteligente)

Sistema completo de recomendação de jogadores de futebol baseado em **filtragem colaborativa item-based** com suporte a feedback implícito/explícito, tratamento de *cold-start* por popularidade e interface moderna em **React + TypeScript + Tailwind CSS**.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Dependências](#-dependências)
  - [Backend (Python)](#backend-python)
  - [Frontend (Node.js)](#frontend-nodejs)
- [Instruções de Execução](#-instruções-de-execução)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
  - [3. Acessando a Aplicação](#3-acessando-a-aplicação)
- [Scripts Adicionais e Testes](#-scripts-adicionais-e-testes)
  - [Backend](#backend-scripts)
  - [Frontend](#frontend-scripts)
- [Endpoints da API](#-endpoints-da-api)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🔭 Visão Geral

O projeto é dividido em:
- **Backend**: API REST em **FastAPI** que implementa o algoritmo de recomendação item-based (similaridade de cosseno com regularização/shrinkage), cálculo de interesse com pesos implícitos e notas explícitas, divisão treino/teste e fallback para popularidade (*cold-start*).
- **Frontend**: Aplicação web em **React + TypeScript + Vite + Tailwind CSS**, permitindo simular diferentes perfis de clubes/scouts, visualizar histórico de interações, receber recomendações personalizadas por posição e registrar feedbacks em tempo real.

---

## 🏛 Arquitetura do Projeto

```text
oficina/
├── backend/
│   ├── app/                    # Lógica da aplicação e API FastAPI
│   │   ├── main.py             # Rotas e entrypoint FastAPI
│   │   ├── servico.py          # Regras de negócio e orquestração do modelo
│   │   ├── recomendador.py     # Filtragem colaborativa item-based
│   │   ├── cold_start.py       # Fallback de popularidade
│   │   ├── matriz.py           # Matriz usuário × item e divisão treino/teste
│   │   ├── categorias.py       # Posições e mapeamento (GK, DF, MF, FW)
│   │   ├── repositorio.py      # Persistência atômica em arquivos JSON
│   │   └── config.py           # Hiperparâmetros e caminhos
│   ├── dados/                  # Base de dados (JSON e CSV bruto)
│   │   └── brutos/             # CSV com dados dos jogadores
│   ├── docs/                   # Contrato de API e documentações
│   ├── scripts/                # Scripts auxiliares (gerar dados, demo)
│   └── requirements.txt        # Dependências Python
│
├── frontend/
│   ├── src/                    # Código-fonte React (componentes, telas, api)
│   ├── package.json            # Dependências e scripts npm
│   └── vite.config.ts          # Configuração do Vite
│
└── README.md                   # Documentação principal
```

---

## ⚙️ Pré-requisitos

Certifique-se de ter instalado em seu ambiente:
- **Python** `>= 3.10`
- **Node.js** `>= 18.0.0` (recomendado `>= 20.x`) e **npm** `>= 9.x`
- **Git** (opcional, para controle de versão)

---

## 📦 Dependências

### Backend (Python)

As dependências estão listadas em [`backend/requirements.txt`](file:///c:/Users/nnast/Desktop/oficina/backend/requirements.txt):

| Pacote | Versão Mínima | Função no Projeto |
|---|---|---|
| `fastapi` | `>= 0.110` | Framework web assíncrono para construção dos endpoints REST da API |
| `uvicorn` | `>= 0.29` | Servidor ASGI de alta performance para execução do FastAPI |
| `pydantic` | `~= 2.13.5` | Validação de dados, tipagem e serialização de schemas da API |
| `numpy` | `>= 1.26` | Operações matriciais e vetoriais para cálculo de similaridade e scores |
| `pandas` | `>= 2.1` | Carga, transformação e limpeza dos dados brutos dos jogadores (CSV) |
| `scipy` | `>= 1.12.0` | Algoritmos científicos e manipulação de matrizes de similaridade |
| `pytest` | `>= 8.0` | Framework de testes unitários e de integração |
| `httpx` | `>= 0.27` | Cliente HTTP utilizado nos testes automatizados (`TestClient`) |

### Frontend (Node.js)

As dependências estão listadas em [`frontend/package.json`](file:///c:/Users/nnast/Desktop/oficina/frontend/package.json):

**Dependências de Produção:**
- `react (^19.2.8)`: Biblioteca declarativa para construção de interfaces.
- `react-dom (^19.2.8)`: Integração do React com a árvore DOM do navegador.
- `tailwindcss (^4.3.3)` & `@tailwindcss/vite (^4.3.3)`: Framework CSS utilitário para estilização responsiva e moderna.

**Dependências de Desenvolvimento:**
- `vite (^8.3.0)`: Ferramenta de build moderna com suporte a Hot Module Replacement (HMR).
- `typescript (~6.0.2)`: Sistema de tipagem estática.
- `@types/react`, `@types/react-dom`, `@types/node`: Definições de tipos TypeScript.
- `@vitejs/plugin-react (^6.1.1)`: Plugin do Vite para compilação React com Fast Refresh.
- `eslint (^10.10.0)` e plugins associados: Linter de código estático.

---

## 🚀 Instruções de Execução

Recomenda-se abrir dois terminais: um para o **Backend** e outro para o **Frontend**.

---

### 1. Backend

1. **Acesse o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Crie e ative um ambiente virtual:**
   - **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt - CMD):**
     ```cmd
     python -m venv .venv
     .\.venv\Scripts\activate.bat
     ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **(Opcional / Inicial) Gerar base de dados e simulações:**
   *Caso os arquivos em `dados/*.json` precisem ser recriados a partir do CSV original:*
   ```bash
   python -m scripts.gerar_dados
   ```

5. **Inicie o servidor da API (FastAPI):**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   O backend estará disponível em `http://localhost:8000`.

---

### 2. Frontend

1. **Acesse o diretório do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O Vite iniciará a aplicação, tipicamente em `http://localhost:5173`.

---

### 3. Acessando a Aplicação

- **Interface Web do Sistema:** [http://localhost:5173](http://localhost:5173)
- **Documentação Interativa da API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Documentação Alternativa da API (Redoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Scripts Adicionais e Testes

### Backend Scripts

A partir do diretório `backend/` (com o ambiente virtual ativo):

- **Executar testes automatizados:**
  ```bash
  pytest
  ```
- **Executar demonstração rápida de recomendação no terminal:**
  ```bash
  python -m scripts.demo_recomendacao
  ```
- **Regenerar dados de catálogo, interações e divisões de teste:**
  ```bash
  python -m scripts.gerar_dados
  ```

### Frontend Scripts

A partir do diretório `frontend/`:

- **Iniciar servidor de desenvolvimento:**
  ```bash
  npm run dev
  ```
- **Compilar para produção (Typecheck + Build):**
  ```bash
  npm run build
  ```
- **Executar verificação estática de código (Linter):**
  ```bash
  npm run lint
  ```
- **Visualizar localmente o build de produção:**
  ```bash
  npm run preview
  ```

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/usuarios` | Lista todos os usuários disponíveis (incluindo perfis de teste) |
| `GET` | `/categorias` | Lista as categorias de jogadores (`GK`, `DF`, `MF`, `FW`) |
| `GET` | `/historico/{id_usuario}` | Histórico de interações e avaliações do usuário selecionado |
| `GET` | `/recomendacoes/{id_usuario}` | Recomendações personalizadas (ou populares em cold-start) com filtro de posição |
| `POST` | `/interacao` | Registra interação implícita (`visualizou`, `selecionou`, `favoritou`, `descartou`) |
| `POST` | `/avaliacao` | Registra avaliação explícita (nota de 1 a 5) para um jogador |
| `GET` | `/metricas` | Métricas de avaliação offline (HitRate@5, MRR@5, nDCG@5, etc.) |

---

## 🔐 Variáveis de Ambiente

### Backend
- `CORS_ORIGENS`: Lista de URLs permitidas no CORS separadas por vírgula (Padrão: `http://localhost:5173,http://localhost:3000`).

### Frontend
- `VITE_API_URL`: URL base do backend FastAPI (Padrão: `http://localhost:8000`). Pode ser configurada criando um arquivo `.env` dentro de `frontend/`:
  ```env
  VITE_API_URL=http://localhost:8000
  ```

---
- [Objetivo](#objetivo)
- [Fundamentação](#fundamentação)
- [Dados](#dados)
- [Método e arquitetura](#método-e-arquitetura)
- [API](#api)
- [Avaliação](#avaliação)
- [Resultados](#resultados)
- [Limitações](#limitações)
- [Conclusão](#conclusão)

---

## Objetivo

Departamentos de scouting acumulam histórico de interações (visualizações, seleções, favoritos, descartes e notas), mas ele é subutilizado: cada nova busca recomeça do zero, sem aproveitar as preferências já demonstradas pelo usuário nem as de scouts com gosto parecido.

**Objetivo geral:** construir um sistema de recomendação por filtragem colaborativa que, a partir da base de interações usuário–jogador, sugira de forma personalizada jogadores ainda desconhecidos pelo usuário, com possibilidade de filtrar por posição.

**Objetivos específicos:**

- Estruturar a base de interações em arquivos JSON e em uma matriz usuário–jogador.
- Implementar a filtragem colaborativa item-based para estimar a afinidade entre usuário e jogador.
- Gerar recomendações Top-N excluindo jogadores já conhecidos e o elenco do próprio clube.
- Permitir o filtro de gap por posição (goleiro, defensor, meio-campista, atacante).
- Tratar o usuário sem histórico (*cold-start*) com um fallback por popularidade.
- Disponibilizar uma API para consultar histórico, gerar recomendações e registrar avaliações, consumida pela interface web.
- Avaliar o resultado com métricas de ranking (Top-k) e de correlação/regressão.

---

## Fundamentação

A filtragem colaborativa recomenda itens a partir dos padrões de interação de uma comunidade, sem exigir atributos de conteúdo. Aqui, o **item** é o jogador e o **usuário** é o clube ou scout.

**Item-based.** Recomenda jogadores parecidos com os que o próprio usuário já valorizou. Dois jogadores são parecidos quando os mesmos usuários se interessaram por ambos. A abordagem tende a ser mais estável que a user-based quando há poucos usuários e muitos itens, como nesta base (205 usuários e 864 jogadores).

**Similaridade.** Cosseno entre as colunas da matriz usuário–jogador, adequado a dados esparsos:

```
                  Σᵤ r_ui · r_uj
sim(i, j) = ─────────────────────────────
             √(Σᵤ r_ui²) · √(Σᵤ r_uj²)
```

**Score de afinidade.** Para estimar o interesse do usuário *u* no jogador candidato *i*, usam-se os *K* jogadores do histórico de *u* mais parecidos com *i* (conjunto *N*):

```
              Σ_{j∈N} sim(i, j) · r_uj
r̂_ui = ─────────────────────────────────
             Σ_{j∈N} sim(i, j) + λ
```

O termo **λ** (suavização) reduz o score de candidatos apoiados em pouca evidência de similaridade.

**Feedback implícito e explícito.** O modelo é misto: cada tipo de interação (visualizou, selecionou, favoritou, descartou) vira um peso de interesse, e a nota explícita de 1 a 5, quando existe, é combinada a esse peso.

**Cold-start.** Sem histórico não há similaridade personalizada. Nesse caso o sistema recorre à popularidade geral ou por posição e avisa que a recomendação ainda não é personalizada.

---

## Dados

A base combina **estatísticas reais de jogadores** com **interações usuário–jogador simuladas**, porque o dataset de estatísticas não traz usuários nem avaliações.

### Catálogo de jogadores

Vem do dataset *Football Players Stats (2025-2026)*: 2.839 linhas e 102 colunas de estatísticas da temporada 2025/26 das cinco grandes ligas (96 clubes). Preparação:

1. Jogadores que trocaram de clube aparecem em duas linhas; somam-se os números e mantêm-se clube, posição e liga da linha com mais minutos (**2.690 jogadores únicos**).
2. Permanecem apenas jogadores com **pelo menos 1.800 minutos** na temporada (cerca de 20 jogos completos), resultando em **864 jogadores**.
3. A categoria é a primeira posição listada (GK, DF, MF ou FW); a lista completa fica em `posicoes`, e 200 jogadores têm duas posições.

| Categoria | Jogadores no catálogo |
|---|---:|
| Meio-campista (MF) | 359 |
| Defensor (DF) | 312 |
| Atacante (FW) | 100 |
| Goleiro (GK) | 93 |

### Usuários

São **205** clubes ou scouts. Cinco são usuários de teste da avaliação; os outros 200 formam a comunidade simulada, necessária para que a filtragem colaborativa tenha co-ocorrências suficientes.

| Usuário | Clube | Perfil de histórico | Interações |
|---|---|---|---:|
| U1 João Silva | Arsenal | rico | 60 |
| U2 María García | Barcelona | moderado | 30 |
| U3 Pierre Dubois | Paris Saint-Germain | rico | 80 |
| U4 Hans Müller | Bayern Munich | escasso | 10 |
| U5 Linh Nguyen | Ajax | sem histórico (cold-start) | 0 |
| Comunidade (200) | — | de escasso a rico | 6 a 120 (mediana 73) |

### Interações sintéticas

Cada usuário recebe um **gosto latente** (posições preferidas, idade alvo, peso de qualidade, ataque e defesa, ligas de interesse) e interage com jogadores sorteados com probabilidade proporcional à afinidade. Nenhum usuário interage com jogadores do próprio clube. O modelo **nunca enxerga** o gosto latente nem as estatísticas: usa só as interações. Isso valida o pipeline, mas os resultados **não valem como evidência sobre scouts reais**.

### Arquivos JSON

A persistência é feita em cinco arquivos, acessados apenas pelo backend:

| Arquivo | Conteúdo | Registros |
|---|---|---:|
| `usuarios.json` | id, nome, papel, clube, preferências iniciais | 205 |
| `itens.json` | id, nome, categoria, posições, clube, liga, nacionalidade, idade, minutos, gols, assistências | 864 |
| `interacoes.json` | usuário, item, tipo (visualizou, selecionou, favoritou, descartou), peso implícito, data | 16.630 |
| `avaliacoes.json` | usuário, item, nota de 1 a 5, comentário opcional, data | 6.419 |
| `recomendacoes_log.json` | recomendações geradas, scores, data, versão do modelo | cresce com o uso |

### Preparação

Os eventos brutos viram uma linha por par usuário–jogador (**14.267 pares**, densidade de 8% da matriz):

- Registros com usuário ou jogador inexistente, tipo desconhecido ou nota fora de 1 a 5 são descartados.
- Se o par tem vários eventos, vale o mais recente; o mesmo vale para a nota.
- O valor de interesse fica entre 0 e 1:
  - **sem nota:** peso do tipo de interação (visualizou `0,2`; selecionou `0,6`; favoritou `0,9`; descartou `0`);
  - **com nota:** `0,7 × nota/5 + 0,3 × peso`.
- **Holdout:** para cada usuário com pelo menos 5 interações, os 20% mais recentes vão para teste. Resultam **11.407 interações de treino** e **2.860 de teste**, das quais **1.639 são relevantes** (interesse ≥ 0,6).

---

## Método e arquitetura

Três camadas independentes:

```
┌────────────────────┐      ┌────────────────────┐      ┌────────────────┐
│  Interface web     │ ───▶ │   API              │ ───▶ │  Arquivos JSON │
│  React + TypeScript│      │   Python + FastAPI │      │  (só o backend)│
└────────────────────┘      └────────────────────┘      └────────────────┘
```

**Filtragem item-based.** A matriz usuário–jogador (205 × 864) é montada só com o treino. A similaridade por cosseno entre jogadores é calculada uma vez e reaproveitada por todos os usuários. Para cada candidato, o score usa os **K = 50** jogadores do histórico do usuário mais parecidos com ele e **λ = 10** na suavização.

**Exclusões.** Nunca são recomendados jogadores com os quais o usuário já interagiu (inclusive os descartados) nem jogadores do elenco do próprio clube.

**Gap por posição.** O score é calculado com todo o histórico do usuário, de qualquer posição, e só a lista final é filtrada pela categoria pedida. Um jogador com duas posições (ex.: MF e FW) aparece nos filtros das duas. Junto ao score, a API devolve `score_pct`, a razão entre o score do jogador e o do melhor candidato do usuário (0 a 100).

**Cold-start.** Usuários com menos de 3 interações recebem o ranking de popularidade: a soma do interesse que todos os usuários demonstraram por cada jogador, também filtrável por posição. A resposta traz `personalizada: false` e um aviso para a interface. Se a filtragem colaborativa não encontrar candidatos suficientes, a lista é completada por popularidade, e cada item informa sua `origem`.

**Ciclo de atualização.** Cada avaliação ou interação registrada é gravada nos JSON (com escrita atômica) e o modelo é recalculado na hora; assim, o jogador avaliado ou descartado deixa de ser sugerido na consulta seguinte.

---

## API

A especificação completa, com tipos TypeScript, está em [`docs/contrato_api.md`](docs/contrato_api.md).

| Método | Rota | Função |
|---|---|---|
| `GET` | `/categorias` | Posições para os filtros de gap |
| `GET` | `/usuarios` | Lista de usuários (5 de teste por padrão), com indicação de cold-start |
| `GET` | `/usuarios/{id}/historico` | Interações e notas, com filtros por tipo e posição |
| `GET` | `/usuarios/{id}/recomendacoes` | Top-N, com filtro de posição opcional |
| `POST` | `/avaliacoes` | Registra nota de 1 a 5 |
| `POST` | `/interacoes` | Registra visualizou, selecionou, favoritou ou descartou |

---

## Avaliação

### Protocolo

O modelo é montado apenas com o treino; o teste (interações mais recentes de cada usuário, só as relevantes) fica escondido. Para cada usuário gera-se o **Top-5** e calculam-se Precision@5 e Recall@5. Como referência, comparam-se dois *baselines*: o **ranking de popularidade** e um **sorteio aleatório** (valor esperado exato).

Os resultados são segmentados pelo volume de histórico do usuário no treino:

| Segmento | Interações no treino |
|---|---|
| Escasso | até 15 |
| Moderado | 16 a 60 |
| Rico | mais de 60 |

### Métricas

São 9 métricas: 5 de ranking e 4 de correlação.

**Ranking** (calculadas por usuário e depois promediadas). Um item é relevante quando marcado como tal no holdout. Só entram usuários com histórico suficiente e ao menos um item relevante no teste; para os demais, a métrica é exibida como N/A.

| Métrica | Descrição | Fórmula |
|---|---|---|
| **Precision@K** | Pureza da lista: das K recomendações, quantas eram relevantes | acertos no top-K ÷ K |
| **Recall@K** | Cobertura: dos itens relevantes do usuário, quantos vieram no top-K | acertos no top-K ÷ total de relevantes no teste |
| **MAP@K**, **MRR**, **NDCG@K** | Métricas de ranking que consideram a posição dos acertos na lista | — |

Exemplos: com K = 5 e 2 acertos, Precision@5 = 0,40; com 2 acertos em 11 relevantes, Recall@5 ≈ 0,18 (seu valor máximo é limitado pelo tamanho de K).

**Correlação.** Comparam o score previsto com o interesse real dos itens do holdout. Os pares (score previsto, valor real) de todos os usuários com histórico são reunidos, e itens sem score ficam de fora. Com menos de 3 pares ou uma série constante, a métrica é indefinida (N/A).

- **Coeficiente de Pearson:** correlação linear entre score e interesse real, de −1 a 1; valores próximos de 1 indicam que o score cresce proporcionalmente ao interesse.

### Validação da lógica

Dados, recomendação, gap, cold-start e feedback são cobertos por testes automatizados (**pytest**) e por um roteiro de casos de teste manuais.

---

## Resultados

Na avaliação com **207 usuários** (205 com histórico e 2 em cold-start):

| Métrica | Valor |
|---|---:|
| Precision@5 | 0,08 |
| Recall@5 | 0,05 |
| Pearson (score × interesse real) | 0,27 (associação positiva, porém fraca) |

### Usuários de teste (K = 5)

Modelo montado só com o treino; Top-5 comparado aos itens relevantes reservados no teste.

| Usuário | Perfil | Interações (treino) | Relevantes (teste) | Acertos no Top-5 | Precision@5 | Recall@5 |
|---|---|---:|---:|---:|---:|---:|
| U1 João Silva | rico | 61 | 7 | 1 | 0,20 | 0,14 |
| U2 María García | moderado | 36 | 3 | 0 | 0,00 | 0,00 |
| U3 Pierre Dubois | rico | 82 | 11 | 2 | 0,40 | 0,18 |
| U4 Hans Müller | escasso | 15 | 2 | 0 | 0,00 | 0,00 |
| U5 Linh Nguyen | escasso | 4 | 0 | n/a | n/a | n/a |

Para U5 as métricas não se aplicam, pois não há itens relevantes no teste. Com apenas quatro usuários avaliáveis e 23 itens relevantes, a amostra é pequena demais para conclusões. A média dos quatro é: **Precision@5 = 0,15, Recall@5 = 0,08, MAP@5 = 0,11, MRR = 0,38 e NDCG@5 = 0,18**, e dois deles não tiveram nenhum acerto.

---

## Limitações

- **Dados sintéticos.** O gosto latente foi construído sobre as mesmas estatísticas que definem os jogadores, o que pode facilitar a recuperação da estrutura de similaridade. Os números absolutos tendem a ser otimistas.
- **Hiperparâmetros ajustados no próprio teste.** K = 50 e λ = 10 foram escolhidos no mesmo holdout usado na avaliação, sem conjunto de validação separado, o que também favorece os números reportados.
- **Amostra dos usuários de teste.** Só quatro dos cinco têm itens relevantes no teste (23 no total). A avaliação com 200 usuários é mais estável, mas continua simulada.
- **Tempo simulado.** As datas das interações são sintéticas; separar as "mais recentes" para teste não reflete mudanças reais de preferência.
- **Esparsidade.** A matriz tem 8% de densidade, e 10 jogadores não têm nenhuma interação no treino, então nunca são recomendados (*cold-start* de item).
- **Cold-start de usuário e viés de popularidade.** Com menos de 3 interações a lista é a de popularidade, que favorece jogadores já populares e reduz a diversidade. Mesmo com poucas interações (até 15), o item-based ficou abaixo da popularidade na avaliação.
- **Só interações, sem atributos.** A filtragem ignora idade, custo, disponibilidade e estatísticas do jogador; recomenda apenas por co-ocorrência de interesse.
- **Posições agrupadas em quatro categorias.** O dataset não distingue zagueiro de lateral nem volante de meia, então o gap "volante" não pode ser pedido diretamente.
- **Descartar depois de avaliar.** Um jogador descartado que já tinha nota mantém o valor da nota (0,56 para nota 4) e continua contando como interesse moderado na similaridade.
- **Persistência em JSON.** Cada feedback regrava o arquivo inteiro e recalcula o modelo, sem controle de concorrência entre processos. Adequado a protótipo, não a muitos usuários simultâneos.

---

## Conclusão

O projeto entrega um fluxo completo, do dado bruto à recomendação: catálogo de 864 jogadores, matriz usuário–jogador, filtragem item-based, filtro de gap por posição, fallback por popularidade para usuários sem histórico e uma API que registra avaliações e atualiza o modelo na hora.

Na avaliação com 207 usuários, o sistema obteve Precision@5 de 0,08, Recall@5 de 0,05 e Pearson de 0,27. Nos cinco usuários de teste, quatro puderam ser avaliados; entre eles houve 3 acertos em 23 itens relevantes, com dois usuários tendo ao menos um acerto no top-5. O resultado é baixo, mas a amostra é pequena demais para conclusões.

Como os dados são simulados e os hiperparâmetros foram ajustados no próprio teste, **os números valem para validar o método, não para prometer desempenho em campo.**
