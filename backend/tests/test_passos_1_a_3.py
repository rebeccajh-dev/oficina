import numpy as np
import pandas as pd
import pytest

from app import config
from app.matriz import (
    construir_matriz,
    consolidar_interacoes,
    dividir_treino_teste,
    usuarios_cold_start,
)
from app.recomendador import RecomendadorItemBased, bloqueios_por_clube

USUARIOS = {"A", "B"}
ITENS = {"i1", "i2", "i3"}


def ev(u, i, tipo, ts):
    return {"id_usuario": u, "id_item": i, "tipo_interacao": tipo, "peso_implicito": 0, "timestamp": ts}


def test_consolidar_mantem_evento_mais_recente_e_calcula_valor_com_nota():
    interacoes = [
        ev("A", "i1", "visualizou", "2026-01-01T10:00:00"),
        ev("A", "i1", "favoritou", "2026-01-02T10:00:00"),
    ]
    avaliacoes = [{"id_usuario": "A", "id_item": "i1", "nota": 5, "timestamp": "2026-01-02T10:05:00"}]
    df = consolidar_interacoes(interacoes, avaliacoes, USUARIOS, ITENS)
    assert len(df) == 1
    assert df.loc[0, "tipo_interacao"] == "favoritou"
    esperado = config.PESO_NOTA * 1.0 + (1 - config.PESO_NOTA) * config.PESOS_IMPLICITOS["favoritou"]
    assert df.loc[0, "valor"] == pytest.approx(esperado)
    assert bool(df.loc[0, "relevante"])


def test_consolidar_descarta_ids_invalidos_e_notas_fora_da_escala():
    interacoes = [ev("Z", "i1", "visualizou", "2026-01-01"), ev("A", "x9", "visualizou", "2026-01-01")]
    avaliacoes = [{"id_usuario": "A", "id_item": "i2", "nota": 9, "timestamp": "2026-01-01"}]
    df = consolidar_interacoes(interacoes, avaliacoes, USUARIOS, ITENS)
    assert df.empty


def test_split_reserva_os_mais_recentes_e_poupa_usuarios_com_pouco_historico():
    linhas = [{"id_usuario": "A", "id_item": f"i{k}", "valor": 0.5, "relevante": False,
               "timestamp": pd.Timestamp("2026-01-01") + pd.Timedelta(days=k)} for k in range(10)]
    linhas += [{"id_usuario": "B", "id_item": "i1", "valor": 0.5, "relevante": False,
                "timestamp": pd.Timestamp("2026-01-01")}]
    treino, teste = dividir_treino_teste(pd.DataFrame(linhas))
    assert set(teste["id_usuario"]) == {"A"}
    assert len(teste) == 2 and teste["timestamp"].min() > treino.loc[treino.id_usuario == "A", "timestamp"].max()
    assert usuarios_cold_start(treino, ["A", "B", "C"]) == ["B", "C"]


def montar_recomendador():
    # A e B gostam de i1 e i2; B também gosta de i3 -> A deve receber i3.
    ids_u, ids_i = ["A", "B", "C"], ["i1", "i2", "i3", "i4"]
    linhas = [("A", "i1", .9), ("A", "i2", .9), ("B", "i1", .9), ("B", "i2", .9), ("B", "i3", .9),
              ("C", "i4", .9), ("C", "i1", .2)]
    df = pd.DataFrame(linhas, columns=["id_usuario", "id_item", "valor"])
    return RecomendadorItemBased(construir_matriz(df, ids_u, ids_i), suavizacao=0.1, k=5)


def test_recomenda_item_coerente_e_exclui_conhecidos():
    rec = montar_recomendador()
    top = [r["id_item"] for r in rec.recomendar("A", n=5)]
    assert top[0] == "i3"
    assert not ({"i1", "i2"} & set(top))


def test_descartado_continua_conhecido():
    ids_u, ids_i = ["A", "B"], ["i1", "i2"]
    df = pd.DataFrame([("A", "i1", 0.0), ("B", "i1", 0.9), ("B", "i2", 0.9)], columns=["id_usuario", "id_item", "valor"])
    rec = RecomendadorItemBased(construir_matriz(df, ids_u, ids_i))
    assert "i1" not in [r["id_item"] for r in rec.recomendar("A")]


def test_exclui_proprio_elenco_e_sinaliza_cold_start():
    ids_u, ids_i = ["A", "B"], ["i1", "i2", "i3"]
    df = pd.DataFrame([("A", "i1", .9), ("B", "i1", .9), ("B", "i2", .9), ("B", "i3", .9)],
                      columns=["id_usuario", "id_item", "valor"])
    usuarios = [{"id_usuario": "A", "clube": "X"}, {"id_usuario": "B", "clube": "Y"}]
    itens = [{"id_item": "i1", "clube": "Y"}, {"id_item": "i2", "clube": "X"}, {"id_item": "i3", "clube": "Y"}]
    rec = RecomendadorItemBased(construir_matriz(df, ids_u, ids_i), bloqueios_por_clube(usuarios, itens), suavizacao=0.1)
    assert [r["id_item"] for r in rec.recomendar("A")] == ["i3"]  # i2 é do elenco de A
    assert not rec.tem_historico("A")  # só 1 interação (< MIN_HISTORICO)
    with pytest.raises(KeyError):
        rec.recomendar("fantasma")
