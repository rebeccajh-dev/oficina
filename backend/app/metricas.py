"""Métricas de avaliação (Passo 6) com split treino/teste.

Métricas de ranking (top-K, por usuário, depois média):
  Precision@K, Recall@K, MAP@K, MRR, NDCG@K
  -> usuários com histórico suficiente; Recall/MAP/MRR/NDCG só entram
     se o usuário tiver ao menos 1 item relevante no teste.

Métricas de correlação/regressão (score previsto x interesse real):
  R², Pearson, Spearman, Kendall Tau
  -> pares (score previsto, valor real) dos itens do holdout, juntando
     todos os usuários com histórico. Itens sem score (sem evidência de
     similaridade ou do próprio elenco) ficam de fora.
"""
from __future__ import annotations

from functools import lru_cache
from math import log2

import numpy as np
from scipy import stats

from . import config
from .pipeline import construir_recomendador, preparar_dados


def precision_recall_at_k(recomendados: list[str], relevantes: set[str], k: int) -> tuple[int, float, float | None]:
    """Devolve (acertos, Precision@K, Recall@K).

    Recall@K é None quando o usuário não tem nenhum item relevante no teste
    (a métrica não se aplica).
    """
    acertos = len(set(recomendados[:k]) & set(relevantes))
    recall = acertos / len(relevantes) if relevantes else None
    return acertos, acertos / k, recall


def _media(valores: list[float]) -> float:
    return round(float(sum(valores) / len(valores)), 4) if valores else 0.0


def _limpo(x: float) -> float:
    """Converte NaN/inf em 0.0 (JSON não aceita NaN)."""
    return round(float(x), 4) if np.isfinite(x) else 0.0


def _correlacoes(y_real: list[float], y_prev: list[float]) -> dict:
    resultado = {"r2": 0.0, "r2_calibrado": 0.0, "pearson": 0.0, "spearman": 0.0, "kendall_tau": 0.0}
    if len(y_real) < 3:
        return resultado

    yr = np.asarray(y_real, dtype=float)
    yp = np.asarray(y_prev, dtype=float)

    # R² diz quanto a variação do interesse real o score explica: 1 é perfeito, 0 equivale a preservar sempre a média
    #e valores negativos são piores que isso
    ss_tot = float(((yr - yr.mean()) ** 2).sum())
    if ss_tot > 0:
        resultado["r2"] = _limpo(1 - float(((yr - yp) ** 2).sum()) / ss_tot)

    # Correlações só existem se nenhuma das séries for constante.
    #Pearson, spearman e kendall tau obtém de uma biblioteca com as funções prontas dentro dele
    #o import scipy tras essa funções
    #pearson**2 calcula a correlação linear entre score e interesse, de -1 a 1
    #spearman é o pearson aplicado as posições dos valores, mede se o modelo ordena os itens
    #na mesma ordem do interesse real, mesmo que a relação não seja linear
    #kendalltau(yr, yp)[0] olha todos os pares de itens e conta quantos o modelo ordenou igual ao real
    #contra os ordenados ao contrário (discordantes) também vai de -1 a 1


    if ss_tot > 0 and np.ptp(yp) > 0:
        pearson = float(stats.pearsonr(yr, yp)[0])
        resultado["pearson"] = _limpo(pearson)
        resultado["r2_calibrado"] = _limpo(pearson**2)  # R² após ajuste linear score -> valor
        resultado["spearman"] = _limpo(stats.spearmanr(yr, yp)[0])
        resultado["kendall_tau"] = _limpo(stats.kendalltau(yr, yp)[0])
    return resultado


@lru_cache(maxsize=8)
def calcular_metricas(k: int = 5) -> dict:
    """Calcula as nove métricas sobre o holdout reservado."""
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
    # Ranking: Precision@K, Recall@K, MAP@K, MRR, NDCG@K
    # ------------------------------------------------------------------
    linhas_metricas = []
    precisoes, recalls, rrs, aps, ndcgs = [], [], [], [], []

    for u in teste_usuarios:
        uid = u["id_usuario"]
        n_interacoes = int((dados.interacoes["id_usuario"] == uid).sum())
        alvo = relevantes_por_u.get(uid, set())
        qtd_relevantes = len(alvo)

        acertos = 0
        precisao = recall = rr = ap = ndcg = 0.0

        if rec.tem_historico(uid):
            top_ids = [r["id_item"] for r in rec.recomendar(uid, k)]
            rel = [1 if i in alvo else 0 for i in top_ids]
            acertos = sum(rel)


            #precisão calculada, mede a purexa da lista: das K sugestões, quantas eram boas
            #com K=5 e 2 acertos, fica igual a 0,40
            #único métrica de ranking calculada para usuários sem nenhum item relevante no teste
            precisao = round(acertos / k, 4)
            precisoes.append(precisao)

            if qtd_relevantes > 0:
                #acertos ja leva em consideração o total relevante no teste
                #mede a cobertura dos itens que o usuário realmente gostou, quantos o modelo trouxe
                #o recall é limitado pelo tamanho de K
                recall = round(acertos / qtd_relevantes, 4)

                #ele so olha para o primeiro acerto e ignora o resto da lista
                #responde em quanto o tempo o usuário encontra algo útil
                rr = next((1 / (p + 1) for p, x in enumerate(rel) if x), 0.0)

                #duas etapas: 1 -> soma a precision em cada posição onde houve acertos e divide por minimos relevantes
                #depois, tira a média entre os usuários
                ap = sum(sum(rel[: p + 1]) / (p + 1) for p, x in enumerate(rel) if x) / min(qtd_relevantes, k)

                #compara o ganho da lista com o de uma lista perfeita, acertos no topo pesam mais
                dcg = sum(x / log2(p + 2) for p, x in enumerate(rel))
                idcg = sum(1 / log2(p + 2) for p in range(min(qtd_relevantes, k)))
                ndcg = dcg / idcg if idcg > 0 else 0.0

                rr, ap, ndcg = round(rr, 4), round(ap, 4), round(ndcg, 4)

                recalls.append(recall)
                rrs.append(rr)
                aps.append(ap)
                ndcgs.append(ndcg)

        linhas_metricas.append(
            {
                "id_usuario": uid,
                "usuario": u["nome"],
                "clube": u["clube"],
                "papel": u.get("papel", ""),
                "interacoes": n_interacoes,
                "relevantes": qtd_relevantes,
                "acertos": acertos,
                "precisao": precisao,
                "recall": recall,
                "rr": rr,
                "ap": ap,
                "ndcg": ndcg,
            }
        )

    # ------------------------------------------------------------------
    # Correlação: score previsto x interesse real no holdout
    # (todos os usuários com histórico e itens de teste, para ter mais pares)
    # faz o treinamento aqui
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
        # --- as nove métricas ---
        "precisao_media": _media(precisoes),
        "recall_medio": _media(recalls),
        "map": _media(aps),
        "mrr": _media(rrs),
        "ndcg": _media(ndcgs),
        **_correlacoes(y_real, y_prev),  # r2, pearson, spearman, kendall_tau (+ r2_calibrado)
        # --- contexto ---
        "pares_correlacao": len(y_real),
        "usuarios_ativos": usuarios_ativos,
        "total_usuarios": len(linhas_metricas),
        "total_interacoes": int(len(dados.interacoes)),
        "por_usuario": linhas_metricas,
    }