"""Passo 2 - Preparação: limpeza, pesos de interesse, matriz usuário×item e split."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from . import config


# --------------------------------------------------------------------------
# Limpeza e consolidação
# --------------------------------------------------------------------------
def consolidar_interacoes(
    interacoes: list[dict],
    avaliacoes: list[dict],
    ids_usuarios: set[str],
    ids_itens: set[str],
) -> pd.DataFrame:
    """Une eventos implícitos e notas explícitas em UMA linha por par (usuário, item).

    Regras de limpeza:
      - descarta ids que não existem em usuarios/itens;
      - descarta tipos de interação desconhecidos e notas fora de 1-5;
      - se o par tem vários eventos, vale o mais recente (ex.: visualizou -> favoritou);
      - se o par tem várias notas, vale a mais recente.

    Valor de interesse (0 a 1):
      sem nota  -> peso implícito do último evento
      com nota  -> PESO_NOTA * (nota/5) + (1 - PESO_NOTA) * peso implícito
    """
    ev = pd.DataFrame(interacoes)
    ev = ev[
        ev["id_usuario"].isin(ids_usuarios)
        & ev["id_item"].isin(ids_itens)
        & ev["tipo_interacao"].isin(config.PESOS_IMPLICITOS)
    ].copy()
    ev["timestamp"] = pd.to_datetime(ev["timestamp"])
    ev["peso_implicito"] = ev["tipo_interacao"].map(config.PESOS_IMPLICITOS)  # fonte única dos pesos
    ev = ev.sort_values("timestamp").drop_duplicates(["id_usuario", "id_item"], keep="last")

    notas = pd.DataFrame(avaliacoes, columns=["id_usuario", "id_item", "nota", "timestamp"])
    notas = notas[notas["nota"].between(1, 5)].copy()
    notas["timestamp_nota"] = pd.to_datetime(notas["timestamp"])
    notas = notas.sort_values("timestamp_nota").drop_duplicates(["id_usuario", "id_item"], keep="last")

    df = ev.merge(notas[["id_usuario", "id_item", "nota", "timestamp_nota"]], on=["id_usuario", "id_item"], how="outer")
    df = df[df["id_usuario"].isin(ids_usuarios) & df["id_item"].isin(ids_itens)]
    # nota sem evento implícito: trata como "selecionou" implícito neutro (peso 0.6)
    df["peso_implicito"] = df["peso_implicito"].fillna(config.PESOS_IMPLICITOS["selecionou"])
    df["timestamp"] = df["timestamp"].fillna(df["timestamp_nota"])
    df["tipo_interacao"] = df["tipo_interacao"].fillna("avaliou")

    com_nota = df["nota"].notna()
    df["valor"] = df["peso_implicito"]
    df.loc[com_nota, "valor"] = (
        config.PESO_NOTA * df.loc[com_nota, "nota"] / 5 + (1 - config.PESO_NOTA) * df.loc[com_nota, "peso_implicito"]
    )
    df["relevante"] = df["valor"] >= config.LIMIAR_RELEVANCIA
    cols = ["id_usuario", "id_item", "tipo_interacao", "nota", "valor", "relevante", "timestamp"]
    return df[cols].sort_values(["id_usuario", "timestamp"]).reset_index(drop=True)


# --------------------------------------------------------------------------
# Split treino/teste (holdout por usuário)
# --------------------------------------------------------------------------
def dividir_treino_teste(
    df: pd.DataFrame,
    fracao_teste: float = config.FRACAO_TESTE,
    min_interacoes: int = config.MIN_INTERACOES_PARA_TESTE,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Reserva as interações MAIS RECENTES de cada usuário para teste.

    Usuários com menos de `min_interacoes` ficam só no treino (sem holdout).
    """
    treino, teste = [], []
    for _, g in df.sort_values("timestamp").groupby("id_usuario"):
        if len(g) < min_interacoes:
            treino.append(g)
            continue
        n_teste = max(1, round(len(g) * fracao_teste))
        treino.append(g.iloc[:-n_teste])
        teste.append(g.iloc[-n_teste:])
    vazio = df.iloc[0:0]
    return (
        pd.concat(treino) if treino else vazio,
        pd.concat(teste) if teste else vazio,
    )


def usuarios_cold_start(treino: pd.DataFrame, ids_usuarios: list[str], minimo: int = config.MIN_HISTORICO) -> list[str]:
    """Usuários com menos de `minimo` interações no treino (inclui os sem nenhuma)."""
    contagem = treino.groupby("id_usuario").size()
    return [u for u in ids_usuarios if contagem.get(u, 0) < minimo]


# --------------------------------------------------------------------------
# Matriz usuário × item
# --------------------------------------------------------------------------
@dataclass
class MatrizUsuarioItem:
    """Matriz densa de interesse (0 = não observado). ~40×1600 cabe folgado em memória.

    `observado` é uma máscara separada: um "descartou" sem nota tem valor 0.0,
    mas continua sendo um item conhecido (não deve ser recomendado de novo).
    """

    valores: np.ndarray
    observado: np.ndarray
    ids_usuarios: list[str]
    ids_itens: list[str]

    def __post_init__(self) -> None:
        self.idx_usuario = {u: i for i, u in enumerate(self.ids_usuarios)}
        self.idx_item = {t: i for i, t in enumerate(self.ids_itens)}

    def itens_conhecidos(self, id_usuario: str) -> set[str]:
        """Itens com que o usuário já interagiu (qualquer valor observado, inclusive descartes)."""
        if id_usuario not in self.idx_usuario:
            return set()
        linha = self.observado[self.idx_usuario[id_usuario]]
        return {self.ids_itens[j] for j in np.flatnonzero(linha)}


def construir_matriz(df: pd.DataFrame, ids_usuarios: list[str], ids_itens: list[str]) -> MatrizUsuarioItem:
    forma = (len(ids_usuarios), len(ids_itens))
    matriz = MatrizUsuarioItem(np.zeros(forma), np.zeros(forma, dtype=bool), ids_usuarios, ids_itens)
    u = df["id_usuario"].map(matriz.idx_usuario).to_numpy()
    i = df["id_item"].map(matriz.idx_item).to_numpy()
    matriz.valores[u, i] = df["valor"].to_numpy()
    matriz.observado[u, i] = True
    return matriz
