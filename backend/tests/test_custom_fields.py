import os

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db_session
from app.main import app

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="defina TEST_DATABASE_URL para executar os testes PostgreSQL",
)


@pytest.fixture
def client(session):
    def override_db_session():
        yield session

    app.dependency_overrides[get_db_session] = override_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def customer_payload(name: str = "Cliente campos") -> dict[str, str]:
    return {
        "nome": name,
        "cidade": "São Paulo",
        "estado": "SP",
        "rua": "Rua A",
        "numero": "10",
    }


def test_custom_fields_are_isolated_typed_and_validated(client: TestClient) -> None:
    customer_field = client.post(
        "/api/settings/custom-fields/customers",
        json={"nome": "Segmento", "tipo": "select", "opcoes": ["VIP", "Novo"]},
    )
    assert customer_field.status_code == 201
    assert customer_field.json()["tipo"] == "select"

    product_field = client.post(
        "/api/settings/custom-fields/products",
        json={"nome": "Segmento", "tipo": "text"},
    )
    assert product_field.status_code == 201
    assert (
        client.get("/api/settings/custom-fields/customers").json()[0]["tipo"]
        == "select"
    )
    assert (
        client.get("/api/settings/custom-fields/products").json()[0]["tipo"] == "text"
    )

    customer = client.post(
        "/api/customers",
        json={**customer_payload(), "campos_personalizados": {"Segmento": "VIP"}},
    )
    assert customer.status_code == 201
    assert customer.json()["campos_personalizados"][0]["valor"] == "VIP"
    customer_id = customer.json()["id"]
    detail = client.get(f"/api/customers/{customer_id}")
    assert detail.json()["campos_personalizados"][0]["nome"] == "Segmento"

    deactivated = client.patch(
        f"/api/settings/custom-fields/customers/{customer_field.json()['id']}",
        json={"ativo": False},
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["ativo"] is False

    invalid_value = client.post(
        "/api/customers",
        json={
            **customer_payload("Cliente inválido"),
            "campos_personalizados": {"Segmento": "Bloqueado"},
        },
    )
    assert invalid_value.status_code == 422

    required_field = client.post(
        "/api/settings/custom-fields/customers",
        json={"nome": "Código", "tipo": "integer", "obrigatorio": True},
    )
    assert required_field.status_code == 201
    missing_required = client.post(
        "/api/customers",
        json=customer_payload("Cliente sem código"),
    )
    assert missing_required.status_code == 422
    typed_customer = client.post(
        "/api/customers",
        json={
            **customer_payload("Cliente com código"),
            "campos_personalizados": {"Código": 42},
        },
    )
    assert typed_customer.status_code == 201
    assert (
        next(
            field
            for field in typed_customer.json()["campos_personalizados"]
            if field["nome"] == "Código"
        )["valor"]
        == 42
    )
