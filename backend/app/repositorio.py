"""Serviço de Dados: toda leitura/escrita dos arquivos JSON passa por aqui."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

from . import config


def ler_json(caminho: Path) -> Any:
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def salvar_json(caminho: Path, dados: Any) -> None:
    """Escrita atômica: grava num arquivo temporário e troca, para nunca deixar JSON pela metade."""
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=caminho.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        os.replace(tmp, caminho)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


class RepositorioJSON:
    """Acesso aos JSON de uma pasta de dados (parametrizável para facilitar testes)."""

    def __init__(self, dir_dados: Path = config.DIR_DADOS) -> None:
        self.dir = Path(dir_dados)
        self.arq_usuarios = self.dir / "usuarios.json"
        self.arq_itens = self.dir / "itens.json"
        self.arq_interacoes = self.dir / "interacoes.json"
        self.arq_avaliacoes = self.dir / "avaliacoes.json"
        self.arq_log = self.dir / "recomendacoes_log.json"

    def carregar_usuarios(self) -> list[dict]:
        return ler_json(self.arq_usuarios)

    def carregar_itens(self) -> list[dict]:
        return ler_json(self.arq_itens)

    def carregar_interacoes(self) -> list[dict]:
        return ler_json(self.arq_interacoes)

    def carregar_avaliacoes(self) -> list[dict]:
        return ler_json(self.arq_avaliacoes)

    def carregar_log(self) -> list[dict]:
        return ler_json(self.arq_log) if self.arq_log.exists() else []

    def salvar_interacoes(self, dados: list[dict]) -> None:
        salvar_json(self.arq_interacoes, dados)

    def salvar_avaliacoes(self, dados: list[dict]) -> None:
        salvar_json(self.arq_avaliacoes, dados)

    def salvar_log(self, dados: list[dict]) -> None:
        salvar_json(self.arq_log, dados)


# Atalhos usados pelos scripts/pipeline dos passos 1-3 (repositório padrão).
REPO_PADRAO = RepositorioJSON()
carregar_usuarios = REPO_PADRAO.carregar_usuarios
carregar_itens = REPO_PADRAO.carregar_itens
carregar_interacoes = REPO_PADRAO.carregar_interacoes
carregar_avaliacoes = REPO_PADRAO.carregar_avaliacoes
