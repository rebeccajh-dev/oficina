"""Fallback de popularidade: usado para usuários sem histórico suficiente (cold-start).

Popularidade de um jogador = soma do interesse (0 a 1) que todos os usuários
demonstraram por ele. Combina volume (quantos olharam) e qualidade (quão bem
avaliaram). `score_pct` é essa soma relativa ao jogador mais popular do catálogo.
"""
from __future__ import annotations

import numpy as np

from .matriz import MatrizUsuarioItem


class RankingPopularidade:
    def __init__(
        self,
        matriz: MatrizUsuarioItem,
        bloqueios: dict[str, set[str]] | None = None,
        mascaras_categoria: dict[str, np.ndarray] | None = None,
    ) -> None:
        self.matriz = matriz
        self.bloqueios = bloqueios or {}
        self.mascaras_categoria = mascaras_categoria or {}
        self.popularidade = matriz.valores.sum(axis=0)
        maximo = float(self.popularidade.max()) if self.popularidade.size else 0.0
        self.maximo = maximo if maximo > 0 else 1.0

    def recomendar(
        self,
        id_usuario: str,
        n: int,
        categoria: str | None = None,
        excluir: set[str] | None = None,
    ) -> list[dict]:
        m = self.matriz
        if id_usuario not in m.idx_usuario:
            raise KeyError(f"usuário desconhecido: {id_usuario}")
        if categoria is not None and categoria not in self.mascaras_categoria:
            raise KeyError(f"categoria desconhecida: {categoria}")

        pode = ~m.observado[m.idx_usuario[id_usuario]]  # nunca sugere o que já conhece
        proibidos = set(self.bloqueios.get(id_usuario, ())) | set(excluir or ())
        for id_item in proibidos:
            j = m.idx_item.get(id_item)
            if j is not None:
                pode[j] = False
        if categoria is not None:
            pode &= self.mascaras_categoria[categoria]

        candidatos = np.flatnonzero(pode & (self.popularidade > 0))
        melhores = candidatos[np.argsort(-self.popularidade[candidatos])[:n]]
        return [
            {
                "id_item": m.ids_itens[j],
                "score": round(float(self.popularidade[j]), 4),
                "score_pct": round(100 * float(self.popularidade[j]) / self.maximo, 1),
            }
            for j in melhores
        ]
