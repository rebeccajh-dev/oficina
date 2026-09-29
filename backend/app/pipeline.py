"""Orquestra os passos 1-3: carrega JSON, prepara dados, monta o recomendador."""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from . import config, repositorio
from .matriz import (
    MatrizUsuarioItem,
    construir_matriz,
    consolidar_interacoes,
    dividir_treino_teste,
    usuarios_cold_start,
)
from .categorias import mascaras_por_categoria
from .recomendador import RecomendadorItemBased, bloqueios_por_clube


@dataclass
class DadosPreparados:
    usuarios: list[dict]
    itens: list[dict]
    interacoes: pd.DataFrame  # todas, já consolidadas
    treino: pd.DataFrame
    teste: pd.DataFrame
    cold_start: list[str]

    @property
    def ids_usuarios(self) -> list[str]:
        return [u["id_usuario"] for u in self.usuarios]

    @property
    def ids_itens(self) -> list[str]:
        return [i["id_item"] for i in self.itens]


def preparar_dados(salvar_split: bool = True) -> DadosPreparados:
    usuarios = repositorio.carregar_usuarios()
    itens = repositorio.carregar_itens()
    ids_u = [u["id_usuario"] for u in usuarios]
    ids_i = [i["id_item"] for i in itens]

    df = consolidar_interacoes(
        repositorio.carregar_interacoes(), repositorio.carregar_avaliacoes(), set(ids_u), set(ids_i)
    )
    treino, teste = dividir_treino_teste(df)
    cold = usuarios_cold_start(treino, ids_u)

    if salvar_split:
        repositorio.salvar_json(
            config.ARQ_SPLIT,
            {
                u: {
                    "treino": treino.loc[treino["id_usuario"] == u, "id_item"].tolist(),
                    "teste": teste.loc[teste["id_usuario"] == u, "id_item"].tolist(),
                    "teste_relevantes": teste.loc[
                        (teste["id_usuario"] == u) & teste["relevante"], "id_item"
                    ].tolist(),
                }
                for u in ids_u
            },
        )
    return DadosPreparados(usuarios, itens, df, treino, teste, cold)


def construir_recomendador(dados: DadosPreparados, usar_treino: bool = True) -> RecomendadorItemBased:
    """usar_treino=True  -> avaliação (o teste fica "escondido").
    usar_treino=False -> produção (todo o histórico conta como conhecido)."""
    base = dados.treino if usar_treino else dados.interacoes
    matriz: MatrizUsuarioItem = construir_matriz(base, dados.ids_usuarios, dados.ids_itens)
    return RecomendadorItemBased(
        matriz,
        bloqueios_por_clube(dados.usuarios, dados.itens),
        mascaras_por_categoria(dados.itens, dados.ids_itens),
    )
