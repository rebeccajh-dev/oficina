"""Cálculo das métricas Precision@K e Recall@K com split treino/teste (Passo 6)."""
from __future__ import annotations

from functools import lru_cache

from . import config
from .pipeline import construir_recomendador, preparar_dados


@lru_cache(maxsize=8)
def calcular_metricas(k: int = 5) -> dict:
    """Calcula Precision@K e Recall@K para os perfis de teste sobre o holdout reservado."""
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

    linhas_metricas = []
    precisoes = []
    recalls = []

    for u in teste_usuarios:
        uid = u["id_usuario"]
        n_interacoes = int((dados.interacoes["id_usuario"] == uid).sum())
        alvo = relevantes_por_u.get(uid, set())
        qtd_relevantes = len(alvo)

        if not rec.tem_historico(uid):
            acertos = 0
            precisao = 0.0
            recall = 0.0
        else:
            top = rec.recomendar(uid, k)
            acertos = sum(1 for r in top if r["id_item"] in alvo)
            precisao = round(acertos / k, 4)
            recall = round(acertos / qtd_relevantes, 4) if qtd_relevantes > 0 else 0.0
            precisoes.append(precisao)
            if qtd_relevantes > 0:
                recalls.append(recall)

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
            }
        )

    avg_prec = round(float(sum(precisoes) / len(precisoes)), 4) if precisoes else 0.0
    avg_rec = round(float(sum(recalls) / len(recalls)), 4) if recalls else 0.0
    usuarios_ativos = sum(1 for m in linhas_metricas if m["interacoes"] >= config.MIN_HISTORICO)
    total_interacoes = int(len(dados.interacoes))

    return {
        "k": k,
        "precisao_media": avg_prec,
        "recall_medio": avg_rec,
        "usuarios_ativos": usuarios_ativos,
        "total_usuarios": len(linhas_metricas),
        "total_interacoes": total_interacoes,
        "por_usuario": linhas_metricas,
    }
