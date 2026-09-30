# Backend — Recomendação de jogadores (filtragem colaborativa item-based)


## Pré-requisitos e Dependências

- **Python** `>= 3.10`

As dependências estão definidas em `requirements.txt`:
- `fastapi` (`>=0.110`): Framework web assíncrono para a API REST.
- `uvicorn` (`>=0.29`): Servidor ASGI para executar a aplicação FastAPI.
- `pydantic` (`~=2.13.5`): Validação de tipos e schemas de entrada/saída.
- `numpy` (`>=1.26`): Operações com vetores e matrizes para cálculo de similaridades.
- `pandas` (`>=2.1`): Leitura, tratamento e manipulação dos dados tabulares de jogadores.
- `scipy` (`>=1.12.0`): Manipulação de matrizes esparsas e operações numéricas.
- `pytest` (`>=8.0`): Execução da suíte de testes unitários e de integração.
- `httpx` (`>=0.27`): Cliente HTTP assíncrono para testes via TestClient do FastAPI.

## Como rodar

1. **Crie e ative um ambiente virtual:**
   ```bash
   # Linux/macOS
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Comandos de execução:**
   ```bash
   python -m scripts.gerar_dados        # (re)gera os JSON em dados/
   python -m scripts.demo_recomendacao  # Top-5 para U1..U5 (verificação rápida no terminal)
   pytest                               # roda os testes automatizados
   uvicorn app.main:app --reload --port 8000   # API FastAPI -> http://localhost:8000/docs
   ```

Contrato para o frontend (tipos TypeScript e endpoints): `docs/contrato_api.md`.

## Estrutura
| Caminho | Papel |
|---|---|
| `dados/brutos/` | CSV original (temporada 2025/26) |
| `dados/*.json` | usuarios, itens, interacoes, avaliacoes, recomendacoes_log, split_treino_teste |
| `scripts/gerar_dados.py` | Passo 1: monta catálogo e simula usuários/interações |
| `app/matriz.py` | Passo 2: limpeza, valor de interesse, matriz usuário×item, split |
| `app/recomendador.py` | Passo 3: item-based + exclusão de itens conhecidos |
| `app/categorias.py` | Categorias GK/DF/MF/FW e máscaras (jogador multiposição entra em todas as suas) |
| `app/cold_start.py` | Passo 4: fallback por popularidade |
| `app/servico.py` | Passos 4-5: lógica da aplicação (histórico, recomendação, feedback + atualização do modelo) |
| `app/main.py` | Passo 5: API FastAPI (camada fina sobre o serviço) |
| `app/pipeline.py` | Liga os passos 1-3 para avaliação (treino/teste) |
| `app/repositorio.py` | Única camada que lê/escreve JSON (escrita atômica) |

## Decisões
- **Catálogo:** jogadores com ≥ 1800 min (864). Quem trocou de clube tem as linhas somadas.
- **Categoria:** primeira posição do CSV (GK/DF/MF/FW); `posicoes` guarda todas.
- **Interações sintéticas:** o CSV não tem usuários. 205 usuários (5 de teste + 200 da "comunidade"), com gosto latente (posição, idade, estilo, liga). O modelo só enxerga as interações.
- **Usuários de teste:** U1 Arsenal (rico), U2 Bayern (moderado), U3 Real Madrid (rico), U4 Roma (escasso), U5 Marseille (sem histórico).
- **Valor de interesse (0–1):** sem nota = peso do tipo de interação; com nota = 0,7·nota/5 + 0,3·peso.
- **Relevante no teste:** valor ≥ 0,6. **Split:** 20% mais recentes de cada usuário (mín. 5 interações).
- **Exclusão:** itens já conhecidos (inclusive descartados) e jogadores do próprio clube.
- **Gap por posição:** o score usa todo o histórico; só a lista final é filtrada pela categoria.
- **Cold-start:** usuário com < 3 interações recebe o ranking de popularidade (soma do interesse de todos os usuários) e `personalizada: false`. Se a colaborativa não achar candidatos suficientes, completa com popularidade (`origem` de cada item).
- **Feedback:** cada avaliação/interação grava no JSON e recalcula o modelo na hora (~0,1 s).
- **Log:** cada consulta de recomendações é registrada em `recomendacoes_log.json`.

## Limitações conhecidas
- Dados sintéticos: os resultados valem para validar o pipeline, não para generalizar.
- K=50 e λ=10 foram escolhidos olhando o holdout.
