"""Categorias de posição (gap de elenco). Granularidade do dataset: GK/DF/MF/FW."""
from __future__ import annotations

import numpy as np

CATEGORIAS: dict[str, str] = {
    "GK": "Goleiro",
    "DF": "Defensor",
    "MF": "Meio-campista",
    "FW": "Atacante",
}


def mascaras_por_categoria(itens: list[dict], ids_itens: list[str]) -> dict[str, np.ndarray]:
    """Para cada categoria, máscara booleana (na ordem de ids_itens) dos itens que a jogam.

    Um jogador "MF,FW" entra tanto no filtro MF quanto no FW: vale qualquer
    posição listada em `posicoes`, não só a primária.
    """
    por_id = {i["id_item"]: i for i in itens}
    mascaras = {c: np.zeros(len(ids_itens), dtype=bool) for c in CATEGORIAS}
    for j, id_item in enumerate(ids_itens):
        for pos in por_id[id_item]["posicoes"]:
            if pos in mascaras:
                mascaras[pos][j] = True
    return mascaras
