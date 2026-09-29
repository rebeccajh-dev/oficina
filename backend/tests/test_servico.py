"""Testes dos passos 4 e 5 (lógica de gap, cold-start, histórico e feedback).

Usam uma CÓPIA temporária de dados/, então nunca alteram os JSON do projeto.
"""
import shutil
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from app import config
from app.categorias import mascaras_por_categoria
from app.cold_start import RankingPopularidade
from app.matriz import construir_matriz
from app.repositorio import RepositorioJSON
from app.servico import EntradaInvalida, NaoEncontrado, Servico


def servico_temporario(registrar_log=False):
    tmp = Path(tempfile.mkdtemp())
    for nome in ("usuarios", "itens", "interacoes", "avaliacoes", "recomendacoes_log"):
        shutil.copy(config.DIR_DADOS / f"{nome}.json", tmp / f"{nome}.json")
    return Servico(RepositorioJSON(tmp), registrar_log=registrar_log), tmp


def test_listagem_padrao_traz_so_os_5_usuarios_de_teste():
    s, _ = servico_temporario()
    usuarios = s.listar_usuarios()
    assert [u["id_usuario"] for u in usuarios] == ["U1", "U2", "U3", "U4", "U5"]
    assert [u["cold_start"] for u in usuarios] == [False, False, False, False, True]
    assert len(s.listar_usuarios(incluir_comunidade=True)) > 5
    assert [u["id_usuario"] for u in s.listar_usuarios(busca="arsenal")] == ["U1"]


def test_gap_por_categoria_respeita_posicoes_conhecidos_e_proprio_elenco():
    s, _ = servico_temporario()
    conhecidos = s.recomendador.matriz.itens_conhecidos("U1")
    for cat in ("GK", "DF", "MF", "FW"):
        r = s.recomendar("U1", 5, cat)
        assert r["personalizada"] and len(r["recomendacoes"]) == 5
        for rec in r["recomendacoes"]:
            assert cat in rec["posicoes"]  # vale qualquer posição listada, não só a primária
            assert rec["id_item"] not in conhecidos
            assert rec["clube"] != "Arsenal"  # nunca o próprio elenco
        scores = [x["score"] for x in r["recomendacoes"]]
        assert scores == sorted(scores, reverse=True)


def test_jogador_multiposicao_aparece_nos_dois_filtros():
    s, _ = servico_temporario()
    multi = [i for i in s.itens if len(i["posicoes"]) > 1][0]
    for pos in multi["posicoes"]:
        assert s.recomendador.mascaras_categoria[pos][s.recomendador.matriz.idx_item[multi["id_item"]]]


def test_cold_start_usa_popularidade_com_aviso_e_respeita_categoria():
    s, _ = servico_temporario()
    r = s.recomendar("U5", 5, "MF")
    assert r["personalizada"] is False and r["aviso"]
    assert len(r["recomendacoes"]) == 5
    assert {x["origem"] for x in r["recomendacoes"]} == {"popularidade"}
    assert all("MF" in x["posicoes"] for x in r["recomendacoes"])
    scores = [x["score"] for x in r["recomendacoes"]]
    assert scores == sorted(scores, reverse=True)


def test_usuario_com_historico_nao_recebe_aviso():
    s, _ = servico_temporario()
    r = s.recomendar("U3", 5)
    assert r["personalizada"] and r["aviso"] is None
    assert all(x["origem"] == "colaborativa" for x in r["recomendacoes"])


def test_historico_resumo_e_filtros():
    s, _ = servico_temporario()
    h = s.historico("U1")
    assert h["resumo"]["total_interacoes"] == len(h["itens"]) == 60
    assert 0 < h["resumo"]["total_avaliacoes"] < 60
    assert len(h["resumo"]["posicoes_top"]) == 3
    datas = [i["timestamp"] for i in h["itens"]]
    assert datas == sorted(datas, reverse=True)
    so_mf = s.historico("U1", categoria="MF")
    assert so_mf["total_filtrado"] < 60 and all("MF" in i["posicoes"] for i in so_mf["itens"])
    assert so_mf["resumo"]["total_interacoes"] == 60  # o resumo ignora filtros
    vazio = s.historico("U5")
    assert vazio["resumo"]["total_interacoes"] == 0 and vazio["itens"] == []


def test_descartar_remove_jogador_das_proximas_recomendacoes():
    s, _ = servico_temporario()
    topo = s.recomendar("U1", 5, "DF")["recomendacoes"][0]["id_item"]
    s.registrar_interacao("U1", topo, "descartou")
    depois = [x["id_item"] for x in s.recomendar("U1", 50, "DF")["recomendacoes"]]
    assert topo not in depois


def test_avaliar_persiste_atualiza_modelo_e_tira_usuario_do_cold_start():
    s, tmp = servico_temporario(registrar_log=True)
    ids = [x["id_item"] for x in s.recomendar("U5", 3)["recomendacoes"]]
    assert s.obter_usuario("U5")["cold_start"]
    saida = s.registrar_avaliacao("U5", ids[0], 5, "excelente")
    assert saida["nota"] == 5 and saida["valor_interesse"] > 0.8
    s.registrar_interacao("U5", ids[1], "favoritou")
    s.registrar_interacao("U5", ids[2], "selecionou")
    u5 = s.obter_usuario("U5")
    assert u5["total_interacoes"] == 3 and not u5["cold_start"]
    assert s.recomendar("U5", 5)["personalizada"] is True
    # persistiu em disco: uma instância nova enxerga o feedback e o log
    novo = Servico(RepositorioJSON(tmp))
    assert novo.obter_usuario("U5")["total_interacoes"] == 3
    assert len(RepositorioJSON(tmp).carregar_log()) == 2  # as duas recomendações acima


def test_erros_de_entrada():
    s, _ = servico_temporario()
    with pytest.raises(NaoEncontrado):
        s.recomendar("X9")
    with pytest.raises(NaoEncontrado):
        s.recomendar("U1", 5, "ZZ")
    with pytest.raises(NaoEncontrado):
        s.registrar_avaliacao("U1", "P9999999", 3)
    with pytest.raises(EntradaInvalida):
        s.registrar_avaliacao("U1", s.ids_itens[0], 9)
    with pytest.raises(EntradaInvalida):
        s.registrar_interacao("U1", s.ids_itens[0], "comprou")


def test_popularidade_ordena_por_interesse_total_e_ignora_conhecidos():
    itens = [{"id_item": f"i{k}", "posicoes": ["MF"], "clube": "X"} for k in range(3)]
    ids_u, ids_i = ["A", "B", "C"], ["i0", "i1", "i2"]
    df = pd.DataFrame(
        [("A", "i0", .9), ("B", "i0", .9), ("B", "i1", .5), ("C", "i2", .2)],
        columns=["id_usuario", "id_item", "valor"],
    )
    m = construir_matriz(df, ids_u, ids_i)
    rank = RankingPopularidade(m, mascaras_categoria=mascaras_por_categoria(itens, ids_i))
    assert [r["id_item"] for r in rank.recomendar("C", 5, "MF")] == ["i0", "i1"]  # i2 já é conhecido de C
    assert rank.recomendar("C", 5, "MF")[0]["score_pct"] == 100.0
    assert rank.recomendar("C", 5, "FW") == []
