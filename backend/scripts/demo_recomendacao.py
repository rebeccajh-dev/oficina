"""Demonstração dos passos 1-3: Top-5 para os 5 usuários de teste.

Uso: python -m scripts.demo_recomendacao
(As métricas formais Precision@K/Recall@K ficam para o passo 6; aqui só se
mostra quantos itens do teste apareceram, como verificação rápida.)
"""
from app import config
from app.pipeline import construir_recomendador, preparar_dados

dados = preparar_dados()
rec = construir_recomendador(dados, usar_treino=True)
nome = {i["id_item"]: i for i in dados.itens}
relevantes = dados.teste[dados.teste["relevante"]].groupby("id_usuario")["id_item"].apply(set)

print(f"Cold-start (poucas/nenhuma interação no treino): {dados.cold_start}\n")
for u in ("U1", "U2", "U3", "U4", "U5"):
    n_treino = int((dados.treino["id_usuario"] == u).sum())
    print(f"== {u} ({n_treino} interações no treino) ==")
    if not rec.tem_historico(u):
        print("  sem histórico suficiente -> fallback de popularidade (passo 4)\n")
        continue
    alvo = relevantes.get(u, set())
    top = rec.recomendar(u, config.TOP_N)
    for r in top:
        it = nome[r["id_item"]]
        marca = " <- acerto no teste" if r["id_item"] in alvo else ""
        print(f"  {r['score']:.3f}  {it['nome_perfil']} ({it['categoria']}, {it['clube']}){marca}")
    print(f"  relevantes no teste: {len(alvo)} | acertos: {sum(r['id_item'] in alvo for r in top)}\n")
