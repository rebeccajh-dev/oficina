"""Testes HTTP (exigem fastapi + httpx). Pulados automaticamente se não instalados."""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app, get_servico  # noqa: E402
from tests.test_servico import servico_temporario  # noqa: E402

servico, _ = servico_temporario()
app.dependency_overrides[get_servico] = lambda: servico
client = TestClient(app)


def test_health_e_categorias():
    assert client.get("/health").json() == {"status": "ok"}
    assert [c["codigo"] for c in client.get("/categorias").json()] == ["GK", "DF", "MF", "FW"]


def test_usuarios_historico_e_recomendacoes():
    usuarios = client.get("/usuarios").json()
    assert len(usuarios) == 5
    h = client.get("/usuarios/U1/historico", params={"categoria": "MF"}).json()
    assert h["total_filtrado"] > 0
    r = client.get("/usuarios/U5/recomendacoes", params={"categoria": "MF", "n": 3}).json()
    assert r["personalizada"] is False and len(r["recomendacoes"]) == 3


def test_avaliar_e_erros():
    item = client.get("/usuarios/U2/recomendacoes").json()["recomendacoes"][0]["id_item"]
    ok = client.post("/avaliacoes", json={"id_usuario": "U2", "id_item": item, "nota": 4})
    assert ok.status_code == 201 and ok.json()["nota"] == 4
    assert client.post("/avaliacoes", json={"id_usuario": "U2", "id_item": item, "nota": 9}).status_code == 422
    assert client.get("/usuarios/X9/recomendacoes").status_code == 404
    assert client.get("/usuarios/U1/recomendacoes", params={"categoria": "ZZ"}).status_code == 422


def test_metricas():
    resp = client.get("/metricas", params={"k": 5})
    assert resp.status_code == 200
    dados = resp.json()
    assert dados["k"] == 5
    assert "precisao_media" in dados
    assert "recall_medio" in dados
    assert len(dados["por_usuario"]) >= 5

