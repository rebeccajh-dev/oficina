"""Camada de API (FastAPI). Só traduz HTTP <-> Servico; a lógica fica em app/servico.py.

Rodar (a partir de backend/):
    uvicorn app.main:app --reload --port 8000
Documentação interativa: http://localhost:8000/docs
"""
import os
from enum import Enum
from functools import lru_cache
from typing import Optional

from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import config
from .servico import EntradaInvalida, NaoEncontrado, Servico


class Categoria(str, Enum):
    GK = "GK"
    DF = "DF"
    MF = "MF"
    FW = "FW"


class TipoInteracao(str, Enum):
    visualizou = "visualizou"
    selecionou = "selecionou"
    favoritou = "favoritou"
    descartou = "descartou"
    avaliou = "avaliou"  # só como filtro do histórico (nota sem outro evento)


class TipoInteracaoEntrada(str, Enum):
    visualizou = "visualizou"
    selecionou = "selecionou"
    favoritou = "favoritou"
    descartou = "descartou"


class AvaliacaoEntrada(BaseModel):
    id_usuario: str
    id_item: str
    nota: int = Field(ge=1, le=5, description="Nota de 1 a 5")
    comentario: Optional[str] = None


class InteracaoEntrada(BaseModel):
    id_usuario: str
    id_item: str
    tipo_interacao: TipoInteracaoEntrada


ORIGENS_PADRAO = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

app = FastAPI(
    title="Gap de Elenco - API de recomendação",
    description="Filtragem colaborativa item-based para recomendar jogadores por gap de posição.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGENS", ORIGENS_PADRAO).split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_servico() -> Servico:
    return Servico()


@app.exception_handler(NaoEncontrado)
def tratar_nao_encontrado(request, exc: NaoEncontrado):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(EntradaInvalida)
def tratar_entrada_invalida(request, exc: EntradaInvalida):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/categorias")
def categorias(servico: Servico = Depends(get_servico)):
    """Categorias de posição para os chips de 'Gap por Posição'."""
    return servico.categorias()


@app.get("/usuarios")
def listar_usuarios(
    incluir_comunidade: bool = Query(False, description="Inclui os usuários simulados além dos 5 de teste"),
    busca: Optional[str] = Query(None, description="Filtra por nome ou clube"),
    servico: Servico = Depends(get_servico),
):
    return servico.listar_usuarios(incluir_comunidade, busca)


@app.get("/usuarios/{id_usuario}")
def obter_usuario(id_usuario: str, servico: Servico = Depends(get_servico)):
    return servico.obter_usuario(id_usuario)


@app.get("/usuarios/{id_usuario}/historico")
def historico(
    id_usuario: str,
    tipo: Optional[TipoInteracao] = None,
    categoria: Optional[Categoria] = None,
    servico: Servico = Depends(get_servico),
):
    return servico.historico(
        id_usuario,
        tipo.value if tipo else None,
        categoria.value if categoria else None,
    )


@app.get("/usuarios/{id_usuario}/recomendacoes")
def recomendacoes(
    id_usuario: str,
    categoria: Optional[Categoria] = Query(None, description="Gap de posição; omitido = todas"),
    n: int = Query(config.TOP_N, ge=1, le=50),
    servico: Servico = Depends(get_servico),
):
    return servico.recomendar(id_usuario, n, categoria.value if categoria else None)


@app.post("/avaliacoes", status_code=201)
def criar_avaliacao(corpo: AvaliacaoEntrada, servico: Servico = Depends(get_servico)):
    """Registra a nota (1-5) e atualiza o modelo."""
    return servico.registrar_avaliacao(corpo.id_usuario, corpo.id_item, corpo.nota, corpo.comentario)


@app.post("/interacoes", status_code=201)
def criar_interacao(corpo: InteracaoEntrada, servico: Servico = Depends(get_servico)):
    """Registra visualizou/selecionou/favoritou/descartou e atualiza o modelo."""
    return servico.registrar_interacao(corpo.id_usuario, corpo.id_item, corpo.tipo_interacao.value)


@app.get("/metricas")
def obter_metricas(
    k: int = Query(config.TOP_N, ge=1, le=50, description="K para Precision@K e Recall@K"),
    servico: Servico = Depends(get_servico),
):
    """Métricas de avaliação do modelo (Precision@K e Recall@K sobre o split de teste)."""
    return servico.metricas(k=k)

