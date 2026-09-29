"""Configuração central do backend: caminhos, pesos e hiperparâmetros."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DIR_DADOS = RAIZ / "dados"
CSV_BRUTO = DIR_DADOS / "brutos" / "players_data-2025_2026.csv"

ARQ_USUARIOS = DIR_DADOS / "usuarios.json"
ARQ_ITENS = DIR_DADOS / "itens.json"
ARQ_INTERACOES = DIR_DADOS / "interacoes.json"
ARQ_AVALIACOES = DIR_DADOS / "avaliacoes.json"
ARQ_LOG = DIR_DADOS / "recomendacoes_log.json"
ARQ_SPLIT = DIR_DADOS / "split_treino_teste.json"

SEED = 42

# --- Catálogo ---------------------------------------------------------------
MIN_MINUTOS = 1800  # ~20 jogos completos; quem jogou menos fica fora do catálogo (864 jogadores)

# --- Pesos de interesse -----------------------------------------------------
# Peso implícito de cada tipo de interação (escala 0 a 1).
PESOS_IMPLICITOS = {
    "visualizou": 0.2,
    "selecionou": 0.6,
    "favoritou": 0.9,
    "descartou": 0.0,
}
# Quando existe nota explícita (1-5), ela domina o valor final.
PESO_NOTA = 0.7
LIMIAR_RELEVANCIA = 0.6  # valor >= limiar => item "relevante" no teste

# --- Split treino/teste -----------------------------------------------------
FRACAO_TESTE = 0.2
MIN_INTERACOES_PARA_TESTE = 5  # abaixo disso o usuário não tem holdout
MIN_HISTORICO = 3  # abaixo disso o usuário é tratado como cold-start

# --- Filtragem colaborativa item-based --------------------------------------
K_VIZINHOS = 50  # nº de itens do histórico usados para estimar cada score
SUAVIZACAO = 10.0  # "shrinkage": com valor alto o score vira ~soma ponderada das similaridades
TOP_N = 5
