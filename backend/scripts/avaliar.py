"""Avaliação offline: Precision@5 e Recall@5 com holdout por usuário.

Uso: python -m scripts.avaliar
O modelo é montado só com o TREINO; o teste (interações mais recentes de cada
usuário, apenas as relevantes) fica escondido. Compara o item-based com dois
baselines: popularidade e sorteio aleatório (esperança exata).
Grava o resumo em dados/resultados_avaliacao.json.
"""
import statistics
import time

from app import config, repositorio
from app.cold_start import RankingPopularidade
from app.metricas import precision_recall_at_k
from app.pipeline import construir_recomendador, preparar_dados

K = 5
TESTE = ["U1", "U2", "U3", "U4", "U5"]


def segmento(n_treino: int) -> str:
    if n_treino <= 15:
        return "escasso (até 15)"
    if n_treino <= 60:
        return "moderado (16 a 60)"
    return "rico (mais de 60)"


def media(valores):
    valores = [v for v in valores if v is not None]
    return statistics.mean(valores) if valores else None


def main() -> None:
    dados = preparar_dados(salvar_split=False)
    rec = construir_recomendador(dados, usar_treino=True)
    pop = RankingPopularidade(rec.matriz, rec.bloqueios, rec.mascaras_categoria)
    relevantes = dados.teste[dados.teste["relevante"]].groupby("id_usuario")["id_item"].apply(set).to_dict()
    n_treino = dados.treino.groupby("id_usuario").size().to_dict()
    nome = {u["id_usuario"]: u["nome"] for u in dados.usuarios}

    linhas, tempos = [], []
    for u in dados.ids_usuarios:
        rel = relevantes.get(u, set())
        if not rec.tem_historico(u) or not rel:
            linhas.append({"id_usuario": u, "nome": nome[u], "treino": n_treino.get(u, 0), "relevantes": len(rel),
                           "aplica": False})
            continue
        t0 = time.perf_counter()
        top = [r["id_item"] for r in rec.recomendar(u, K)]
        tempos.append(time.perf_counter() - t0)
        top_pop = [r["id_item"] for r in pop.recomendar(u, K)]
        candidatos = int(((~rec.matriz.observado[rec.matriz.idx_usuario[u]])).sum()) - len(
            [i for i in rec.bloqueios.get(u, ()) if not rec.matriz.observado[rec.matriz.idx_usuario[u], rec.matriz.idx_item[i]]]
        )
        ac, p, r = precision_recall_at_k(top, rel, K)
        ac_p, p_p, r_p = precision_recall_at_k(top_pop, rel, K)
        linhas.append({
            "id_usuario": u, "nome": nome[u], "treino": n_treino[u], "relevantes": len(rel), "aplica": True,
            "recomendados": top, "acertos": ac, "precision": p, "recall": r,
            "acertos_pop": ac_p, "precision_pop": p_p, "recall_pop": r_p,
            "precision_aleatorio": len(rel) / candidatos, "recall_aleatorio": K / candidatos,
            "segmento": segmento(n_treino[u]),
        })

    ativos = [l for l in linhas if l["aplica"]]
    resumo = {
        "k": K,
        "usuarios_avaliados": len(ativos),
        "geral": {m: media([l[m] for l in ativos]) for m in
                  ("precision", "recall", "precision_pop", "recall_pop", "precision_aleatorio", "recall_aleatorio")},
        "erro_padrao_precision": statistics.stdev([l["precision"] for l in ativos]) / len(ativos) ** 0.5,
        "por_segmento": {},
        "tempo_recomendacao_ms": {"mediana": 1000 * statistics.median(tempos), "maximo": 1000 * max(tempos)},
    }
    for seg in sorted({l["segmento"] for l in ativos}):
        grupo = [l for l in ativos if l["segmento"] == seg]
        resumo["por_segmento"][seg] = {
            "usuarios": len(grupo),
            "precision": media([l["precision"] for l in grupo]), "recall": media([l["recall"] for l in grupo]),
            "precision_pop": media([l["precision_pop"] for l in grupo]), "recall_pop": media([l["recall_pop"] for l in grupo]),
        }
    t0 = time.perf_counter()
    construir_recomendador(dados, usar_treino=True)
    resumo["tempo_reconstrucao_modelo_s"] = time.perf_counter() - t0

    print(f"Precision@{K} / Recall@{K} - usuários de teste")
    for l in linhas:
        if l["id_usuario"] in TESTE:
            if l["aplica"]:
                print(f"  {l['id_usuario']} {l['nome']:<14} treino={l['treino']:>3} relevantes={l['relevantes']:>2} "
                      f"acertos={l['acertos']} P={l['precision']:.2f} R={l['recall']:.2f} | pop: acertos={l['acertos_pop']} "
                      f"P={l['precision_pop']:.2f} R={l['recall_pop']:.2f}")
            else:
                print(f"  {l['id_usuario']} {l['nome']:<14} treino={l['treino']:>3} relevantes={l['relevantes']:>2} -> n/a")
    g = resumo["geral"]
    print(f"\nTodos os usuários avaliados (N={resumo['usuarios_avaliados']}):")
    print(f"  item-based  P={g['precision']:.3f} R={g['recall']:.3f} (erro padrão P={resumo['erro_padrao_precision']:.3f})")
    print(f"  popularidade P={g['precision_pop']:.3f} R={g['recall_pop']:.3f}")
    print(f"  aleatório    P={g['precision_aleatorio']:.3f} R={g['recall_aleatorio']:.3f}")
    for seg, v in resumo["por_segmento"].items():
        print(f"  {seg:<22} N={v['usuarios']:>3} item-based P={v['precision']:.3f} R={v['recall']:.3f} | pop P={v['precision_pop']:.3f} R={v['recall_pop']:.3f}")
    print(f"\nTempo por recomendação: mediana {resumo['tempo_recomendacao_ms']['mediana']:.1f} ms, "
          f"máx {resumo['tempo_recomendacao_ms']['maximo']:.1f} ms | reconstrução do modelo: {resumo['tempo_reconstrucao_modelo_s']:.2f} s")
    repositorio.salvar_json(config.DIR_DADOS / "resultados_avaliacao.json", {"resumo": resumo, "usuarios": linhas})


if __name__ == "__main__":
    main()