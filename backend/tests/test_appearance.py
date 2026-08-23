from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app.api.appearance as appearance_api
from app.db.session import get_db_session
from app.main import app


@pytest.fixture
def client(session):
    def override_db_session():
        yield session

    app.dependency_overrides[get_db_session] = override_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_appearance_can_be_read_updated_and_restored(client: TestClient) -> None:
    default_response = client.get("/api/settings/appearance")
    assert default_response.status_code == 200
    assert default_response.json()["nome_sistema"] == "CRM Geral"

    update_response = client.patch(
        "/api/settings/appearance",
        json={
            "nome_sistema": "CRM Exemplo",
            "cor_primaria": "#123456",
            "raio_card": "2rem",
            "rotulo_clientes": "Contas",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["nome_sistema"] == "CRM Exemplo"
    assert update_response.json()["rotulo_clientes"] == "Contas"

    restored_response = client.post("/api/settings/appearance/reset")
    assert restored_response.status_code == 200
    assert restored_response.json()["nome_sistema"] == "CRM Geral"
    assert restored_response.json()["cor_primaria"] == "#487A98"


def test_appearance_rejects_unsafe_values_and_unknown_fields(
    client: TestClient,
) -> None:
    invalid_color = client.patch(
        "/api/settings/appearance",
        json={"cor_primaria": "red"},
    )
    assert invalid_color.status_code == 422

    invalid_radius = client.patch(
        "/api/settings/appearance",
        json={"raio_card": "calc(100vw)"},
    )
    assert invalid_radius.status_code == 422

    unknown_field = client.patch(
        "/api/settings/appearance",
        json={"css_livre": "body { display: none; }"},
    )
    assert unknown_field.status_code == 422


def test_appearance_logo_accepts_supported_image_and_rejects_invalid_content(
    client: TestClient,
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(appearance_api, "LOGO_STORAGE_DIR", tmp_path)
    valid_logo = client.put(
        "/api/settings/appearance/logo",
        content=b"\x89PNG\r\n\x1a\nminimal",
        headers={"Content-Type": "image/png"},
    )
    assert valid_logo.status_code == 200
    logo_url = valid_logo.json()["logo_url"]
    assert logo_url.startswith("/uploads/branding/")
    assert (tmp_path / Path(logo_url).name).exists()

    invalid_logo = client.put(
        "/api/settings/appearance/logo",
        content=b"<svg></svg>",
        headers={"Content-Type": "image/svg+xml"},
    )
    assert invalid_logo.status_code == 415
