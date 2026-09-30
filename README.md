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
