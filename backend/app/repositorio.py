"""Serviço de Dados: toda leitura/escrita dos arquivos JSON passa por aqui."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import config


def ler_json(caminho: Path) -> Any:
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def salvar_json(caminho: Path, dados: Any) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def carregar_usuarios() -> list[dict]:
    return ler_json(config.ARQ_USUARIOS)


def carregar_itens() -> list[dict]:
    return ler_json(config.ARQ_ITENS)


def carregar_interacoes() -> list[dict]:
    return ler_json(config.ARQ_INTERACOES)


def carregar_avaliacoes() -> list[dict]:
    return ler_json(config.ARQ_AVALIACOES)


def registrar_recomendacao(
    id_usuario: str,
    recomendacoes: list[dict],
    versao_modelo: str = "item-based-v1",
) -> None:
    """Acrescenta uma recomendação gerada ao recomendacoes_log.json."""
    log = ler_json(config.ARQ_LOG) if config.ARQ_LOG.exists() else []
    log.append(
        {
            "id_usuario": id_usuario,
            "lista_itens_recomendados": [r["id_item"] for r in recomendacoes],
            "score_por_item": {r["id_item"]: r["score"] for r in recomendacoes},
            "data_geracao": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "versao_do_modelo": versao_modelo,
        }
    )
    salvar_json(config.ARQ_LOG, log)
