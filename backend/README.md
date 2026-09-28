# Backend — Recomendação de jogadores (filtragem colaborativa item-based)

Status: passos 1 a 3 concluídos (dados, matriz/split, motor de recomendação).
Faltam: gap por categoria + cold-start (4), API FastAPI (5), métricas (6).

## Como rodar
```bash
cd backend
pip install -r requirements.txt
python -m scripts.gerar_dados        # (re)gera os JSON em dados/
python -m scripts.demo_recomendacao  # Top-5 para U1..U5
pytest                               # testes
```

## Estrutura
| Caminho | Papel |
|---|---|
| `dados/brutos/` | CSV original (temporada 2025/26) |
| `dados/*.json` | usuarios, itens, interacoes, avaliacoes, recomendacoes_log, split_treino_teste |
| `scripts/gerar_dados.py` | Passo 1: monta catálogo e simula usuários/interações |
| `app/matriz.py` | Passo 2: limpeza, valor de interesse, matriz usuário×item, split |
| `app/recomendador.py` | Passo 3: item-based + exclusão de itens conhecidos |
| `app/pipeline.py` | Liga os passos (carregar → preparar → recomendador) |
| `app/repositorio.py` | Única camada que lê/escreve JSON |

## Decisões
- **Catálogo:** jogadores com ≥ 1800 min (864). Quem trocou de clube tem as linhas somadas.
- **Categoria:** primeira posição do CSV (GK/DF/MF/FW); `posicoes` guarda todas.
- **Interações sintéticas:** o CSV não tem usuários. 205 usuários (5 de teste + 200 da "comunidade"), com gosto latente (posição, idade, estilo, liga). O modelo só enxerga as interações.
- **Usuários de teste:** U1 Arsenal (rico), U2 Bayern (moderado), U3 Real Madrid (rico), U4 Roma (escasso), U5 Marseille (sem histórico).
- **Valor de interesse (0–1):** sem nota = peso do tipo de interação; com nota = 0,7·nota/5 + 0,3·peso.
- **Relevante no teste:** valor ≥ 0,6. **Split:** 20% mais recentes de cada usuário (mín. 5 interações).
- **Exclusão:** itens já conhecidos (inclusive descartados) e jogadores do próprio clube.

## Limitações conhecidas
- Dados sintéticos: os resultados valem para validar o pipeline, não para generalizar.
- K=50 e λ=10 foram escolhidos olhando o holdout; declarar isso no relatório.
