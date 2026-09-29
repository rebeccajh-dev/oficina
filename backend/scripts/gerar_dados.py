"""Passo 1 - Estrutura os JSON (usuarios, itens, interacoes, avaliacoes, log).

Uso (a partir da pasta backend/):
    python -m scripts.gerar_dados [--comunidade 200]

O CSV só traz estatísticas de jogadores; não existe nenhuma interação real
usuário-item. Por isso as interações são SINTÉTICAS: cada usuário (clube/scout)
recebe um "gosto" latente (posições, idade, estilo, liga) e interage com
jogadores amostrados conforme a afinidade. O modelo de recomendação nunca vê
esse gosto latente nem as estatísticas: usa só as interações.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from app import config, repositorio

CATEGORIAS = ["GK", "DF", "MF", "FW"]
SOMAR = ["MP", "Starts", "Min", "90s", "Gls", "Ast", "Sh", "SoT", "Int", "TklW"]
INICIO = datetime(2026, 1, 5)
JANELA_DIAS = 260

# id, clube, nº de interações (perfis de teste: rico / moderado / escasso / sem histórico)
USUARIOS_TESTE = [
    ("U1", "Arsenal", 60),
    ("U2", "Bayern Munich", 30),
    ("U3", "Real Madrid", 80),
    ("U4", "Roma", 10),
    ("U5", "Marseille", 0),
]


# --------------------------------------------------------------------------
# Catálogo (itens.json)
# --------------------------------------------------------------------------
def consolidar_transferencias(df: pd.DataFrame) -> pd.DataFrame:
    """Jogador que trocou de clube aparece em 2 linhas: soma os números e
    mantém clube/posição/liga da linha com mais minutos."""
    df = df.copy()
    df["Born"] = df["Born"].fillna(-1)
    df = df.sort_values("Min", ascending=False)
    principal = df.drop_duplicates(["Player", "Born"], keep="first").set_index(["Player", "Born"])
    somas = df.groupby(["Player", "Born"])[SOMAR].sum()
    principal[SOMAR] = somas.loc[principal.index]
    return principal.reset_index()


def z_por_categoria(serie: pd.Series, categoria: pd.Series) -> pd.Series:
    def z(x: pd.Series) -> pd.Series:
        desvio = x.std(ddof=0)
        return (x - x.mean()) / desvio if desvio > 0 else x * 0.0

    return serie.groupby(categoria).transform(z)


def montar_catalogo(csv) -> pd.DataFrame:
    df = pd.read_csv(csv)
    df = consolidar_transferencias(df)
    df = df[df["Min"] >= config.MIN_MINUTOS].reset_index(drop=True)

    df["posicoes"] = df["Pos"].str.split(",")
    df["categoria"] = df["posicoes"].str[0]  # a 1ª posição listada é a principal
    df["liga"] = df["Comp"].str.split(" ", n=1).str[1]
    df["nacionalidade"] = df["Nation"].str.split(" ").str[-1]
    df["id_item"] = ["P" + str(int(rk)).zfill(4) for rk in df["Rk"]]

    # Features usadas SÓ para simular o gosto dos usuários (não vão pro modelo).
    n90 = df["90s"].clip(lower=0.1)
    ataque = (df["Gls"] + df["Ast"]) / n90 + 0.3 * df["Sh"] / n90
    defesa = (df["Int"] + df["TklW"]) / n90
    df["f_ataque"] = z_por_categoria(ataque, df["categoria"])
    df["f_defesa"] = z_por_categoria(defesa, df["categoria"])
    df.loc[df["categoria"] == "GK", ["f_ataque", "f_defesa"]] = 0.0

    df["On-Off"] = df["On-Off"].fillna(df["On-Off"].median())
    z = lambda c: (df[c] - df[c].mean()) / df[c].std(ddof=0)
    df["f_qualidade"] = (z("Min%") + z("PPM") + z("On-Off")) / 3
    return df


def itens_json(df: pd.DataFrame) -> list[dict]:
    return [
        {
            "id_item": r.id_item,
            "nome_perfil": r.Player,
            "categoria": r.categoria,
            "posicoes": r.posicoes,
            "clube": r.Squad,
            "liga": r.liga,
            "nacionalidade": r.nacionalidade,
            "idade": int(r.Age),
            "minutos": int(r.Min),
            "gols": int(r.Gls),
            "assistencias": int(r.Ast),
        }
        for r in df.itertuples()
    ]


# --------------------------------------------------------------------------
# Usuários e interações sintéticas
# --------------------------------------------------------------------------
def sortear_perfil(rng: np.random.Generator, ligas: list[str]) -> dict:
    return {
        "pos": rng.dirichlet([0.4, 1.2, 1.2, 1.2]),  # peso por GK, DF, MF, FW
        "idade_c": rng.uniform(20, 30),
        "idade_s": rng.uniform(3, 6),
        "w_q": rng.uniform(0.5, 1.2),
        "w_ataque": rng.normal(0, 0.8),
        "w_defesa": rng.normal(0, 0.8),
        "ligas": list(rng.choice(ligas, size=int(rng.integers(1, 3)), replace=False)),
    }


def afinidade_z(perfil: dict, cat_idx: np.ndarray, df: pd.DataFrame, rng) -> np.ndarray:
    aff = (
        perfil["w_q"] * df["f_qualidade"].to_numpy()
        + perfil["w_ataque"] * df["f_ataque"].to_numpy()
        + perfil["w_defesa"] * df["f_defesa"].to_numpy()
        - 0.5 * ((df["Age"].to_numpy() - perfil["idade_c"]) / perfil["idade_s"]) ** 2
        + 0.5 * df["liga"].isin(perfil["ligas"]).to_numpy()
        + 0.6 * np.log(perfil["pos"][cat_idx] + 1e-3)
        + rng.normal(0, 0.5, len(df))
    )
    return (aff - aff.mean()) / aff.std()


def tipo_por_score(s: float) -> str:
    if s >= 4.3:
        return "favoritou"
    if s >= 3.6:
        return "selecionou"
    if s >= 2.6:
        return "visualizou"
    return "descartou"


def simular_usuario(id_usuario, clube, n, perfil, df, cat_idx, rng, temperatura=0.7):
    """Devolve (interacoes, avaliacoes) do usuário."""
    if n == 0:
        return [], []
    z = afinidade_z(perfil, cat_idx, df, rng)
    p = np.exp(z / temperatura)
    p[(df["Squad"] == clube).to_numpy()] = 0.0  # ninguém "descobre" o próprio elenco
    p /= p.sum()
    escolhidos = rng.choice(len(df), size=n, replace=False, p=p)

    interacoes, avaliacoes = [], []
    for i in escolhidos:
        s = 3 + 0.7 * z[i] + rng.normal(0, 0.8)
        tipo = tipo_por_score(s)
        ts = INICIO + timedelta(seconds=int(rng.integers(0, JANELA_DIAS * 86400)))
        item = df["id_item"].iloc[i]

        # Parte das seleções/favoritos é precedida de uma visualização (dado "sujo" realista).
        if tipo in ("selecionou", "favoritou") and rng.random() < 0.3:
            antes = ts - timedelta(days=int(rng.integers(1, 6)))
            interacoes.append(_interacao(id_usuario, item, "visualizou", antes))
        interacoes.append(_interacao(id_usuario, item, tipo, ts))

        if rng.random() < 0.45:  # ~45% dos itens recebem nota explícita
            avaliacoes.append(
                {
                    "id_usuario": id_usuario,
                    "id_item": item,
                    "nota": int(np.clip(round(s), 1, 5)),
                    "comentario_opcional": None,
                    "timestamp": (ts + timedelta(minutes=5)).isoformat(timespec="seconds"),
                }
            )
    return interacoes, avaliacoes


def _interacao(id_usuario, item, tipo, ts):
    return {
        "id_usuario": id_usuario,
        "id_item": item,
        "tipo_interacao": tipo,
        "peso_implicito": config.PESOS_IMPLICITOS[tipo],
        "timestamp": ts.isoformat(timespec="seconds"),
    }


def gerar(n_comunidade: int) -> None:
    rng = np.random.default_rng(config.SEED)
    df = montar_catalogo(config.CSV_BRUTO)
    cat_idx = df["categoria"].map({c: i for i, c in enumerate(CATEGORIAS)}).to_numpy()
    ligas = sorted(df["liga"].unique())

    clubes_teste = {c for _, c, _ in USUARIOS_TESTE}
    clubes_livres = [c for c in sorted(df["Squad"].unique()) if c not in clubes_teste]
    rng.shuffle(clubes_livres)

    definicoes = list(USUARIOS_TESTE)
    for k in range(n_comunidade):
        # a maioria tem histórico amplo; alguns poucos são "escassos"
        n = int(rng.integers(5, 16)) if k % 9 == 8 else int(rng.integers(40, 121))
        definicoes.append((f"C{k + 1:02d}", clubes_livres[k % len(clubes_livres)], n))

    usuarios, interacoes, avaliacoes = [], [], []
    for id_usuario, clube, n in definicoes:
        perfil = sortear_perfil(rng, ligas)
        i, a = simular_usuario(id_usuario, clube, n, perfil, df, cat_idx, rng)
        interacoes += i
        avaliacoes += a
        sem_historico = n == 0
        usuarios.append(
            {
                "id_usuario": id_usuario,
                "nome": clube,
                "papel": "diretor esportivo",
                "clube": clube,
                "preferencias_iniciais": {}
                if sem_historico
                else {
                    "faixa_etaria": [max(17, int(perfil["idade_c"] - perfil["idade_s"])), int(perfil["idade_c"] + perfil["idade_s"])],
                    "ligas": perfil["ligas"],
                },
                "data_cadastro": (INICIO - timedelta(days=int(rng.integers(30, 400)))).date().isoformat(),
            }
        )

    interacoes.sort(key=lambda x: x["timestamp"])
    avaliacoes.sort(key=lambda x: x["timestamp"])

    repositorio.salvar_json(config.ARQ_ITENS, itens_json(df))
    repositorio.salvar_json(config.ARQ_USUARIOS, usuarios)
    repositorio.salvar_json(config.ARQ_INTERACOES, interacoes)
    repositorio.salvar_json(config.ARQ_AVALIACOES, avaliacoes)
    repositorio.salvar_json(config.ARQ_LOG, [])

    print(f"itens: {len(df)} | usuarios: {len(usuarios)} | interacoes: {len(interacoes)} | avaliacoes: {len(avaliacoes)}")
    print("por categoria:", df["categoria"].value_counts().to_dict())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--comunidade", type=int, default=200, help="nº de usuários além dos 5 de teste")
    gerar(ap.parse_args().comunidade)
