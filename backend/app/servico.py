"""Camada de serviço: toda a lógica da aplicação, independente do FastAPI.

A API (app/main.py) só traduz HTTP <-> chamadas deste serviço. Assim a lógica
pode ser testada sem subir servidor.

Estado mantido em memória e sincronizado com os JSON:
  - listas brutas de interações/avaliações (fonte de verdade persistida);
  - DataFrame consolidado, matriz usuário×item, recomendador e ranking de popularidade,
    reconstruídos sob demanda a cada novo feedback (ciclo de atualização do modelo).
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone

import pandas as pd

from . import config
from .categorias import CATEGORIAS, mascaras_por_categoria
from .cold_start import RankingPopularidade
from .matriz import construir_matriz, consolidar_interacoes
from .recomendador import RecomendadorItemBased, bloqueios_por_clube
from .metricas import calcular_metricas
from .repositorio import RepositorioJSON

VERSAO_MODELO = "item-based-v1"
TIPOS_INTERACAO = tuple(config.PESOS_IMPLICITOS)  # visualizou, selecionou, favoritou, descartou

AVISO_COLD_START = (
    "Recomendações baseadas em popularidade. Interaja com jogadores para "
    "personalizar suas sugestões e ativar a filtragem colaborativa."
)


class NaoEncontrado(KeyError):
    """Usuário, item ou categoria inexistente (a API traduz para HTTP 404)."""

    def __str__(self) -> str:  # KeyError normalmente imprime com aspas
        return str(self.args[0])


class EntradaInvalida(ValueError):
    """Valor fora do permitido (nota fora de 1-5, tipo de interação desconhecido...)."""


class Servico:
    def __init__(self, repo: RepositorioJSON | None = None, registrar_log: bool = True) -> None:
        self.repo = repo or RepositorioJSON()
        self.registrar_log = registrar_log
        self._lock = threading.RLock()
        self.usuarios = self.repo.carregar_usuarios()
        self.itens = self.repo.carregar_itens()
        self._interacoes = self.repo.carregar_interacoes()
        self._avaliacoes = self.repo.carregar_avaliacoes()
        self._log = self.repo.carregar_log()

        self.ids_usuarios = [u["id_usuario"] for u in self.usuarios]
        self.ids_itens = [i["id_item"] for i in self.itens]
        self._usuario = {u["id_usuario"]: u for u in self.usuarios}
        self._item = {i["id_item"]: i for i in self.itens}
        self._bloqueios = bloqueios_por_clube(self.usuarios, self.itens)
        self._mascaras = mascaras_por_categoria(self.itens, self.ids_itens)
        self._reconstruir()

    # ------------------------------------------------------------------
    # Modelo
    # ------------------------------------------------------------------
    def _reconstruir(self) -> None:
        """Recalcula consolidação, matriz, similaridades e popularidade (~centenas de ms)."""
        df = consolidar_interacoes(
            self._interacoes, self._avaliacoes, set(self.ids_usuarios), set(self.ids_itens)
        )
        matriz = construir_matriz(df, self.ids_usuarios, self.ids_itens)
        self.df = df
        self.recomendador = RecomendadorItemBased(matriz, self._bloqueios, self._mascaras)
        self.popularidade = RankingPopularidade(matriz, self._bloqueios, self._mascaras)

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------
    def categorias(self) -> list[dict]:
        return [{"codigo": c, "rotulo": r} for c, r in CATEGORIAS.items()]

    def _exigir_usuario(self, id_usuario: str) -> dict:
        if id_usuario not in self._usuario:
            raise NaoEncontrado(f"usuário não encontrado: {id_usuario}")
        return self._usuario[id_usuario]

    def _exigir_item(self, id_item: str) -> dict:
        if id_item not in self._item:
            raise NaoEncontrado(f"jogador não encontrado: {id_item}")
        return self._item[id_item]

    def _exigir_categoria(self, categoria: str | None) -> None:
        if categoria is not None and categoria not in CATEGORIAS:
            raise NaoEncontrado(f"categoria não encontrada: {categoria}")

    def _resumo_usuario(self, u: dict) -> dict:
        linhas = self.df[self.df["id_usuario"] == u["id_usuario"]]
        total = int(len(linhas))
        return {
            **{k: u[k] for k in ("id_usuario", "nome", "papel", "clube", "perfil_teste")},
            "total_interacoes": total,
            "total_avaliacoes": int(linhas["nota"].notna().sum()),
            "tem_historico": total >= config.MIN_HISTORICO,
            "cold_start": total < config.MIN_HISTORICO,
        }

    def listar_usuarios(self, incluir_comunidade: bool = False, busca: str | None = None) -> list[dict]:
        with self._lock:
            lista = [u for u in self.usuarios if incluir_comunidade or u["perfil_teste"]]
            if busca:
                b = busca.casefold()
                lista = [u for u in lista if b in u["nome"].casefold() or b in u["clube"].casefold()]
            return [self._resumo_usuario(u) for u in lista]

    def obter_usuario(self, id_usuario: str) -> dict:
        with self._lock:
            return self._resumo_usuario(self._exigir_usuario(id_usuario))

    def historico(
        self, id_usuario: str, tipo: str | None = None, categoria: str | None = None
    ) -> dict:
        """Histórico do usuário (mais recente primeiro) + resumo para os cards da tela.

        Os filtros valem só para a lista; o resumo sempre descreve o histórico inteiro.
        """
        with self._lock:
            usuario = self._exigir_usuario(id_usuario)
            self._exigir_categoria(categoria)
            if tipo is not None and tipo not in (*TIPOS_INTERACAO, "avaliou"):
                raise EntradaInvalida(f"tipo de interação inválido: {tipo}")

            linhas = self.df[self.df["id_usuario"] == id_usuario].sort_values("timestamp", ascending=False)
            registros = []
            contagem_pos: dict[str, int] = {}
            for r in linhas.itertuples():
                item = self._item[r.id_item]
                for pos in item["posicoes"]:
                    contagem_pos[pos] = contagem_pos.get(pos, 0) + 1
                registros.append((r, item))

            itens = []
            for r, item in registros:
                if tipo is not None and r.tipo_interacao != tipo:
                    continue
                if categoria is not None and categoria not in item["posicoes"]:
                    continue
                itens.append(
                    {
                        "id_item": r.id_item,
                        "nome_perfil": item["nome_perfil"],
                        "categoria": item["categoria"],
                        "posicoes": item["posicoes"],
                        "clube": item["clube"],
                        "tipo_interacao": r.tipo_interacao,
                        "nota": None if pd.isna(r.nota) else int(r.nota),
                        "timestamp": r.timestamp.isoformat(timespec="seconds"),
                    }
                )

            posicoes_top = [
                {"categoria": c, "rotulo": CATEGORIAS[c], "quantidade": q}
                for c, q in sorted(contagem_pos.items(), key=lambda kv: -kv[1])[:3]
            ]
            resumo = self._resumo_usuario(usuario)
            return {
                "usuario": resumo,
                "resumo": {
                    "total_interacoes": resumo["total_interacoes"],
                    "total_avaliacoes": resumo["total_avaliacoes"],
                    "posicoes_top": posicoes_top,
                },
                "total_filtrado": len(itens),
                "itens": itens,
            }

    def recomendar(
        self,
        id_usuario: str,
        n: int = config.TOP_N,
        categoria: str | None = None,
        registrar: bool | None = None,
    ) -> dict:
        """Top-N para o usuário, opcionalmente restrito a uma categoria (gap de elenco).

        - Usuário com histórico: filtragem colaborativa item-based.
          Se ela não achar candidatos suficientes, completa com popularidade
          (cada recomendação traz `origem` = "colaborativa" | "popularidade").
        - Usuário sem histórico suficiente (cold-start): só popularidade, com aviso.
        Sempre exclui o que o usuário já conhece e o elenco do próprio clube.
        """
        with self._lock:
            self._exigir_usuario(id_usuario)
            self._exigir_categoria(categoria)
            personalizada = self.recomendador.tem_historico(id_usuario)

            recs: list[dict] = []
            if personalizada:
                recs = [{**r, "origem": "colaborativa"} for r in self.recomendador.recomendar(id_usuario, n, categoria)]
            if len(recs) < n:
                ja = {r["id_item"] for r in recs}
                extra = self.popularidade.recomendar(id_usuario, n - len(recs), categoria, excluir=ja)
                recs += [{**r, "origem": "popularidade"} for r in extra]

            recomendacoes = []
            for r in recs:
                item = self._item[r["id_item"]]
                recomendacoes.append(
                    {
                        "id_item": item["id_item"],
                        "nome_perfil": item["nome_perfil"],
                        "categoria": item["categoria"],
                        "posicoes": item["posicoes"],
                        "clube": item["clube"],
                        "liga": item["liga"],
                        "nacionalidade": item["nacionalidade"],
                        "idade": item["idade"],
                        "score": r["score"],
                        "score_pct": r["score_pct"],
                        "origem": r["origem"],
                    }
                )

            if self.registrar_log if registrar is None else registrar:
                self._registrar_log(id_usuario, recomendacoes, categoria, personalizada)

            return {
                "id_usuario": id_usuario,
                "categoria": categoria,
                "n_solicitado": n,
                "personalizada": personalizada,
                "aviso": None if personalizada else AVISO_COLD_START,
                "recomendacoes": recomendacoes,
            }

    # ------------------------------------------------------------------
    # Feedback (atualiza JSON e o modelo)
    # ------------------------------------------------------------------
    def registrar_avaliacao(
        self, id_usuario: str, id_item: str, nota: int, comentario: str | None = None
    ) -> dict:
        with self._lock:
            self._exigir_usuario(id_usuario)
            self._exigir_item(id_item)
            if not 1 <= nota <= 5:
                raise EntradaInvalida("a nota deve estar entre 1 e 5")
            self._avaliacoes.append(
                {
                    "id_usuario": id_usuario,
                    "id_item": id_item,
                    "nota": int(nota),
                    "comentario_opcional": comentario,
                    "timestamp": _agora(),
                }
            )
            self.repo.salvar_avaliacoes(self._avaliacoes)
            self._reconstruir()
            return self._estado_apos_feedback(id_usuario, id_item)

    def registrar_interacao(self, id_usuario: str, id_item: str, tipo_interacao: str) -> dict:
        with self._lock:
            self._exigir_usuario(id_usuario)
            self._exigir_item(id_item)
            if tipo_interacao not in TIPOS_INTERACAO:
                raise EntradaInvalida(f"tipo de interação inválido: {tipo_interacao}")
            self._interacoes.append(
                {
                    "id_usuario": id_usuario,
                    "id_item": id_item,
                    "tipo_interacao": tipo_interacao,
                    "peso_implicito": config.PESOS_IMPLICITOS[tipo_interacao],
                    "timestamp": _agora(),
                }
            )
            self.repo.salvar_interacoes(self._interacoes)
            self._reconstruir()
            return self._estado_apos_feedback(id_usuario, id_item)

    def _estado_apos_feedback(self, id_usuario: str, id_item: str) -> dict:
        linha = self.df[(self.df["id_usuario"] == id_usuario) & (self.df["id_item"] == id_item)].iloc[0]
        return {
            "id_usuario": id_usuario,
            "id_item": id_item,
            "tipo_interacao": linha["tipo_interacao"],
            "nota": None if pd.isna(linha["nota"]) else int(linha["nota"]),
            "valor_interesse": round(float(linha["valor"]), 4),
            "usuario": self._resumo_usuario(self._usuario[id_usuario]),
        }

    def metricas(self, k: int = config.TOP_N) -> dict:
        return calcular_metricas(k=k)

    def _registrar_log(self, id_usuario, recomendacoes, categoria, personalizada) -> None:
        self._log.append(
            {
                "id_usuario": id_usuario,
                "lista_itens_recomendados": [r["id_item"] for r in recomendacoes],
                "score_por_item": {r["id_item"]: r["score"] for r in recomendacoes},
                "categoria": categoria,
                "personalizada": personalizada,
                "data_geracao": _agora(),
                "versao_do_modelo": VERSAO_MODELO,
            }
        )
        self.repo.salvar_log(self._log)


def _agora() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat(timespec="seconds")
