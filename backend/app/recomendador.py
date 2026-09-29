"""Passo 3 - Motor de recomendação: filtragem colaborativa item-based.

Ideia: dois jogadores são "parecidos" se os mesmos usuários se interessaram
por ambos. Para estimar o interesse de um usuário em um jogador candidato,
olhamos os jogadores que ele já conhece e que são mais parecidos com o candidato.

    score(u, i) = soma(sim(i, j) * interesse(u, j)) / (soma(sim(i, j)) + lambda)
                  para os K jogadores j do histórico de u mais similares a i

O `lambda` (suavização) evita que um candidato com uma única vizinhança fraca
apareça no topo só porque essa vizinha foi muito bem avaliada. Com a base atual
(muito esparsa) os melhores testes deram lambda alto (10), em que o score é
praticamente a soma ponderada das similaridades. Como esse valor foi escolhido
olhando o próprio holdout, o passo 6 deve reportar isso como limitação.
"""
from __future__ import annotations

import numpy as np

from . import config
from .matriz import MatrizUsuarioItem


def bloqueios_por_clube(usuarios: list[dict], itens: list[dict]) -> dict[str, set[str]]:
    """Cada usuário não deve receber sugestões do próprio elenco."""
    por_clube: dict[str, set[str]] = {}
    for it in itens:
        por_clube.setdefault(it["clube"], set()).add(it["id_item"])
    return {u["id_usuario"]: por_clube.get(u["clube"], set()) for u in usuarios}


class RecomendadorItemBased:
    def __init__(
        self,
        matriz: MatrizUsuarioItem,
        bloqueios: dict[str, set[str]] | None = None,
        mascaras_categoria: dict[str, np.ndarray] | None = None,
        k: int = config.K_VIZINHOS,
        suavizacao: float = config.SUAVIZACAO,
    ) -> None:
        self.matriz = matriz
        self.bloqueios = bloqueios or {}
        self.mascaras_categoria = mascaras_categoria or {}
        self.k = k
        self.suavizacao = suavizacao
        self.similaridade = self._similaridade_cosseno(matriz.valores)

    @staticmethod
    def _similaridade_cosseno(valores: np.ndarray) -> np.ndarray:
        normas = np.linalg.norm(valores, axis=0)
        normas[normas == 0] = 1.0  # item sem interação: similaridade 0 com todos
        normalizada = valores / normas
        sim = normalizada.T @ normalizada
        np.fill_diagonal(sim, 0.0)
        return sim

    def tem_historico(self, id_usuario: str) -> bool:
        """False => caso cold-start (tratado no passo 4)."""
        m = self.matriz
        if id_usuario not in m.idx_usuario:
            return False
        return int(m.observado[m.idx_usuario[id_usuario]].sum()) >= config.MIN_HISTORICO

    def pontuar(self, id_usuario: str) -> np.ndarray:
        """Score de todos os itens para o usuário (-inf onde não pode ser recomendado)."""
        m = self.matriz
        u = m.idx_usuario[id_usuario]
        historico = np.flatnonzero(m.observado[u])
        scores = np.full(len(m.ids_itens), -np.inf)
        if len(historico) == 0:
            return scores

        interesse = m.valores[u, historico]
        sim = self.similaridade[:, historico]  # (n_itens, n_historico)
        if sim.shape[1] > self.k:
            topo = np.argpartition(-sim, self.k - 1, axis=1)[:, : self.k]
            sim = np.take_along_axis(sim, topo, axis=1)
            interesse_vizinhos = interesse[topo]
        else:
            interesse_vizinhos = np.broadcast_to(interesse, sim.shape)

        denominador = sim.sum(axis=1)
        pontuacao = (sim * interesse_vizinhos).sum(axis=1) / (denominador + self.suavizacao)

        # Só pontua quem tem alguma evidência de similaridade.
        com_evidencia = denominador > 0
        scores[com_evidencia] = pontuacao[com_evidencia]

        # Exclusão de itens já conhecidos (inclusive descartados) e do próprio elenco.
        scores[m.observado[u]] = -np.inf
        for id_item in self.bloqueios.get(id_usuario, ()):
            j = m.idx_item.get(id_item)
            if j is not None:
                scores[j] = -np.inf
        return scores

    def recomendar(self, id_usuario: str, n: int = config.TOP_N, categoria: str | None = None) -> list[dict]:
        """Top-N itens ainda não conhecidos, do maior para o menor score.

        `categoria` (GK/DF/MF/FW) restringe o resultado a essa posição (gap de elenco).
        O score é calculado com todo o histórico do usuário, de qualquer posição;
        só a lista final é filtrada. `score_pct` compara com o melhor candidato do
        usuário em qualquer categoria (0 a 100).
        """
        if id_usuario not in self.matriz.idx_usuario:
            raise KeyError(f"usuário desconhecido: {id_usuario}")
        if categoria is not None and categoria not in self.mascaras_categoria:
            raise KeyError(f"categoria desconhecida: {categoria}")
        scores = self.pontuar(id_usuario)
        validos = np.flatnonzero(np.isfinite(scores))
        if len(validos) == 0:
            return []
        maximo = float(scores[validos].max())
        if categoria is not None:
            validos = validos[self.mascaras_categoria[categoria][validos]]
        melhores = validos[np.argsort(-scores[validos])[:n]]
        return [
            {
                "id_item": self.matriz.ids_itens[j],
                "score": round(float(scores[j]), 4),
                "score_pct": round(100 * float(scores[j]) / maximo, 1) if maximo > 0 else 0.0,
            }
            for j in melhores
        ]
