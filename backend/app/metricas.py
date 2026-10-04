"""Métricas de avaliação (Passo 6) com split treino/teste.

Métricas de ranking (top-K, por usuário, depois média):
  Precision@K, Recall@K
  -> só são calculadas para usuários com histórico suficiente E com ao menos
     1 item relevante no teste. Quando a métrica não se aplica, o valor é
     None (vira null no JSON e N/A no front), nunca 0.0.

Métrica de correlação (score previsto x interesse real):
  Pearson
  -> pares (score previsto, valor real) dos itens do holdout, juntando
     todos os usuários com histórico. Itens sem score (sem evidência de
     similaridade ou do próprio elenco) ficam de fora. Se a métrica é
     indefinida (poucos pares ou série constante), o valor é None.
"""
from __future__ import annotations

import numpy as np
from scipy import stats

from . import config
from .pipeline import construir_recomendador, preparar_dados


def _media(valores: list[float]) -> float | None:
    """Média arredondada; None quando não há nenhum valor para agregar."""
    return round(float(sum(valores) / len(valores)), 4) if valores else None


def _limpo(x: float) -> float | None:
    """Converte NaN/inf em None (JSON não aceita NaN; None vira null)."""
    return round(float(x), 4) if np.isfinite(x) else None


def _correlacoes(y_real: list[float], y_prev: list[float]) -> dict:
    # None = indefinido (diferente de "correlação zero")
    resultado = {"pearson": None}
    if len(y_real) < 3:
        return resultado

    yr = np.asarray(y_real, dtype=float)
    yp = np.asarray(y_prev, dtype=float)

    # Pearson só existe se nenhuma das séries for constante.
    # Mede a correlação linear entre score e interesse, de -1 a 1.
    if np.ptp(yr) > 0 and np.ptp(yp) > 0:
        resultado["pearson"] = _limpo(float(stats.pearsonr(yr, yp)[0]))
    return resultado


# SEM @lru_cache: o resultado depende dos dados, que mudam a cada nova
# interação. Com cache indexado só por `k`, o resultado ficava congelado.
def calcular_metricas(k: int = 5) -> dict:
    """Calcula Precision@K, Recall@K e Pearson sobre o holdout reservado."""
    dados = preparar_dados(salvar_split=False)
    rec = construir_recomendador(dados, usar_treino=True)
    relevantes_por_u = (
        dados.teste[dados.teste["relevante"]]
        .groupby("id_usuario")["id_item"]
        .apply(set)
        .to_dict()
    )

    teste_usuarios = [u for u in dados.usuarios if u.get("perfil_teste")]
    if not teste_usuarios:
        teste_usuarios = dados.usuarios[:5]

    # ------------------------------------------------------------------
    # Ranking: Precision@K e Recall@K
    # ------------------------------------------------------------------
    linhas_metricas = []
    precisoes, recalls = [], []

    for u in teste_usuarios:
        uid = u["id_usuario"]
        n_interacoes = int((dados.interacoes["id_usuario"] == uid).sum())
        alvo = relevantes_por_u.get(uid, set())
        qtd_relevantes = len(alvo)
        tem_hist = bool(rec.tem_historico(uid))

        acertos = 0
        # None = "não se aplica" (sem histórico ou sem itens relevantes no teste).
        precisao = recall = None

        if tem_hist and qtd_relevantes > 0:
            top_ids = [r["id_item"] for r in rec.recomendar(uid, k)]
            acertos = len(set(top_ids[:k]) & alvo)

            # precisão: dos K itens sugeridos, quantos eram bons
            # (K=5 e 2 acertos -> 0,40)
            precisao = round(acertos / k, 4)

            # recall: cobertura dos itens que o usuário realmente gostou
            recall = round(acertos / qtd_relevantes, 4)

            precisoes.append(precisao)
            recalls.append(recall)

        linhas_metricas.append(
            {
                "id_usuario": uid,
                "usuario": u["nome"],
                "clube": u["clube"],
                "papel": u.get("papel", ""),
                "interacoes": n_interacoes,
                "relevantes": qtd_relevantes,
                "tem_historico": tem_hist,
                "acertos": acertos,
                "precisao": precisao,
                "recall": recall,
            }
        )

    # ------------------------------------------------------------------
    # Correlação: score previsto x interesse real no holdout
    # (todos os usuários com histórico e itens de teste, para ter mais pares)
    # ------------------------------------------------------------------
    y_real: list[float] = []
    y_prev: list[float] = []
    for uid, g in dados.teste.groupby("id_usuario"):
        if not rec.tem_historico(uid):
            continue
        scores = rec.pontuar(uid)
        for id_item, valor in zip(g["id_item"], g["valor"]):
            j = rec.matriz.idx_item[id_item]
            if np.isfinite(scores[j]):
                y_real.append(float(valor))
                y_prev.append(float(scores[j]))

    usuarios_ativos = sum(1 for m in linhas_metricas if m["interacoes"] >= config.MIN_HISTORICO)

    return {
        "k": k,
        "precisao_media": _media(precisoes),
        "recall_medio": _media(recalls),
        **_correlacoes(y_real, y_prev),  # pearson
        # --- contexto ---
        "pares_correlacao": len(y_real),
        "usuarios_avaliados": len(precisoes),  # usuários que entraram nas médias
        "usuarios_ativos": usuarios_ativos,
        "total_usuarios": len(linhas_metricas),
        "total_interacoes": int(len(dados.interacoes)),
        "por_usuario": linhas_metricas,
    }