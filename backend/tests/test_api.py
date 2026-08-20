import os
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import get_db_session
from app.main import app
from app.models import Cliente, Fornecedor, Funcionario, Produto, Venda, VendaItem

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="defina TEST_DATABASE_URL para executar os testes CRUD PostgreSQL",
)


@pytest.fixture
def client(session):
    def override_db_session():
        yield session

    app.dependency_overrides[get_db_session] = override_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def customer_payload() -> dict[str, str]:
    return {
        "nome": "Cliente API",
        "cidade": "São Paulo",
        "estado": "SP",
        "rua": "Rua A",
        "numero": "10A",
    }


def supplier_payload() -> dict[str, str]:
    return {
        "nome": "Fornecedor API",
        "cidade": "São Paulo",
        "estado": "SP",
        "rua": "Rua B",
        "numero": "20",
        "cnpj": "12.345.678/0001-90",
    }


def employee_payload() -> dict[str, str]:
    return {
        "nome_completo": "Funcionário API",
        "cidade": "São Paulo",
        "estado": "SP",
        "rua": "Rua C",
        "numero": "30",
        "cpf": "123.456.789-09",
        "data_nascimento": "1990-01-01",
    }


def product_payload(supplier_id: int) -> dict[str, object]:
    return {
        "nome": "Produto API",
        "categoria": "Geral",
        "preco_custo": "10.00",
        "preco_venda": "15.50",
        "fornecedor_id": supplier_id,
    }


def seed_sale_dependencies(session):
    supplier = Fornecedor(
        nome="Fornecedor vendas",
        cidade="São Paulo",
        estado="SP",
        rua="Rua Vendas",
        numero="1",
        cnpj="12.345.678/0001-90",
    )
    customer = Cliente(**customer_payload())
    employee = Funcionario(**employee_payload())
    product = Produto(
        nome="Produto vendas",
        categoria="Geral",
        preco_custo=Decimal("7.00"),
        preco_venda=Decimal("15.50"),
        fornecedor=supplier,
    )
    session.add_all([supplier, customer, employee, product])
    session.flush()
    return customer, employee, product


def test_customer_crud_and_validation(client: TestClient) -> None:
    response = client.post("/api/customers", json=customer_payload())
    assert response.status_code == 201
    customer_id = response.json()["id"]

    assert client.get("/api/customers").status_code == 200
    assert client.get(f"/api/customers/{customer_id}").status_code == 200

    update_response = client.patch(
        f"/api/customers/{customer_id}",
        json={"cidade": "Campinas"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["cidade"] == "Campinas"

    assert client.delete(f"/api/customers/{customer_id}").status_code == 204
    assert client.get(f"/api/customers/{customer_id}").status_code == 404

    invalid_response = client.post(
        "/api/customers",
        json={**customer_payload(), "id": 99},
    )
    assert invalid_response.status_code == 422


def test_supplier_crud_duplicate_cnpj_and_referenced_delete(
    client: TestClient,
) -> None:
    response = client.post("/api/suppliers", json=supplier_payload())
    assert response.status_code == 201
    supplier_id = response.json()["id"]
    assert client.get("/api/suppliers").status_code == 200
    assert client.get(f"/api/suppliers/{supplier_id}").status_code == 200

    duplicate = client.post("/api/suppliers", json=supplier_payload())
    assert duplicate.status_code == 409

    product_response = client.post(
        "/api/products",
        json=product_payload(supplier_id),
    )
    assert product_response.status_code == 201

    delete_response = client.delete(f"/api/suppliers/{supplier_id}")
    assert delete_response.status_code == 409


def test_employee_crud_duplicate_cpf_optional_fields_and_referenced_delete(
    client: TestClient,
    session,
) -> None:
    response = client.post("/api/employees", json=employee_payload())
    assert response.status_code == 201
    employee_id = response.json()["id"]
    assert response.json()["rg"] is None
    assert response.json()["complemento"] is None
    assert response.json()["ativo"] is True
    assert client.get("/api/employees").status_code == 200
    assert client.get(f"/api/employees/{employee_id}").status_code == 200

    duplicate = client.post("/api/employees", json=employee_payload())
    assert duplicate.status_code == 409

    customer = Cliente(**customer_payload())
    session.add(customer)
    session.flush()
    session.add(
        Venda(
            cliente_id=customer.id,
            funcionario_id=employee_id,
            data_venda=datetime.now(timezone.utc),
        )
    )
    session.commit()

    delete_response = client.delete(f"/api/employees/{employee_id}")
    assert delete_response.status_code == 409


def test_employee_status_filters_new_sales_and_preserves_history(
    client: TestClient,
    session,
) -> None:
    customer, employee, product = seed_sale_dependencies(session)

    assert client.get("/api/employees?active=true").json() == [
        client.get(f"/api/employees/{employee.id}").json()
    ]
    deactivate_response = client.patch(
        f"/api/employees/{employee.id}",
        json={"ativo": False},
    )
    assert deactivate_response.status_code == 200
    assert deactivate_response.json()["ativo"] is False
    assert client.get("/api/employees?active=true").json() == []
    assert client.get("/api/employees").json()[0]["ativo"] is False

    sale_payload = {
        "cliente_id": customer.id,
        "funcionario_id": employee.id,
        "data_venda": "2026-08-19T15:00:00Z",
        "itens": [{"produto_id": product.id, "quantidade": "1.000"}],
    }
    rejected = client.post("/api/sales", json=sale_payload)
    assert rejected.status_code == 422
    assert "inativo" in rejected.json()["detail"]
    assert session.scalars(select(Venda)).all() == []

    reactivate_response = client.patch(
        f"/api/employees/{employee.id}",
        json={"ativo": True},
    )
    assert reactivate_response.status_code == 200
    assert reactivate_response.json()["ativo"] is True
    assert client.get("/api/employees?active=true").json()[0]["id"] == employee.id

    created = client.post("/api/sales", json=sale_payload)
    assert created.status_code == 201
    sale_id = created.json()["id"]

    client.patch(f"/api/employees/{employee.id}", json={"ativo": False})
    history = client.get(f"/api/sales/{sale_id}")
    assert history.status_code == 200
    assert history.json()["funcionario"]["id"] == employee.id
    assert client.delete(f"/api/employees/{employee.id}").status_code == 409
    assert client.delete(f"/api/sales/{sale_id}").status_code == 204
    assert client.delete(f"/api/employees/{employee.id}").status_code == 204


def test_product_crud_supplier_validation_and_referenced_delete(
    client: TestClient,
    session,
) -> None:
    supplier_response = client.post("/api/suppliers", json=supplier_payload())
    supplier_id = supplier_response.json()["id"]

    invalid_supplier = client.post(
        "/api/products",
        json=product_payload(999999),
    )
    assert invalid_supplier.status_code == 404

    negative_price = client.post(
        "/api/products",
        json={**product_payload(supplier_id), "preco_venda": "-1.00"},
    )
    assert negative_price.status_code == 422

    response = client.post(
        "/api/products",
        json=product_payload(supplier_id),
    )
    assert response.status_code == 201
    product_id = response.json()["id"]
    assert client.get("/api/products").status_code == 200
    assert client.get(f"/api/products/{product_id}").status_code == 200

    update_response = client.patch(
        f"/api/products/{product_id}",
        json={"preco_venda": "16.00"},
    )
    assert update_response.status_code == 200
    assert Decimal(update_response.json()["preco_venda"]) == Decimal("16.00")
    assert client.delete(f"/api/products/{product_id}").status_code == 204

    referenced_product_response = client.post(
        "/api/products",
        json={**product_payload(supplier_id), "nome": "Produto referenciado"},
    )
    referenced_product_id = referenced_product_response.json()["id"]
    customer = Cliente(**customer_payload())
    employee = Funcionario(**employee_payload())
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto_id=referenced_product_id,
                quantidade=Decimal("1.000"),
                preco_unitario=Decimal("15.50"),
                fornecedor_id=supplier_id,
            )
        ],
    )
    session.add(sale)
    session.commit()

    delete_response = client.delete(f"/api/products/{referenced_product_id}")
    assert delete_response.status_code == 409


def test_sale_creation_uses_catalog_price_and_calculates_totals(
    client: TestClient,
    session,
) -> None:
    customer, employee, product = seed_sale_dependencies(session)

    response = client.post(
        "/api/sales",
        json={
            "cliente_id": customer.id,
            "funcionario_id": employee.id,
            "data_venda": "2026-08-19T10:00:00Z",
            "itens": [{"produto_id": product.id, "quantidade": "2.500"}],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["cliente"] == {"id": customer.id, "nome": customer.nome}
    assert body["funcionario"] == {
        "id": employee.id,
        "nome_completo": employee.nome_completo,
    }
    assert len(body["itens"]) == 1
    assert body["itens"][0]["produto"] == {
        "id": product.id,
        "nome": product.nome,
    }
    assert Decimal(str(body["itens"][0]["quantidade"])) == Decimal("2.500")
    assert Decimal(str(body["itens"][0]["preco_unitario"])) == Decimal("15.50")
    assert body["itens"][0]["fornecedor_id"] == product.fornecedor_id
    assert Decimal(str(body["itens"][0]["subtotal"])) == Decimal("38.75")
    assert Decimal(str(body["total"])) == Decimal("38.75")

    sale_id = body["id"]
    persisted = session.scalar(select(Venda).where(Venda.id == sale_id))
    assert persisted is not None
    assert len(persisted.itens) == 1
    assert persisted.itens[0].preco_unitario == Decimal("15.50")
    assert persisted.itens[0].fornecedor_id == product.fornecedor_id


def test_sale_item_preserves_supplier_history_when_product_supplier_changes(
    client: TestClient,
    session,
) -> None:
    customer, employee, product = seed_sale_dependencies(session)
    original_supplier_id = product.fornecedor_id
    second_supplier_response = client.post(
        "/api/suppliers",
        json={
            **supplier_payload(),
            "nome": "Segundo fornecedor de histórico",
            "cnpj": "98.765.432/0001-10",
        },
    )
    assert second_supplier_response.status_code == 201
    second_supplier_id = second_supplier_response.json()["id"]

    sale_payload = {
        "cliente_id": customer.id,
        "funcionario_id": employee.id,
        "data_venda": "2026-08-19T16:00:00Z",
        "itens": [{"produto_id": product.id, "quantidade": "1.000"}],
    }
    first_sale = client.post("/api/sales", json=sale_payload)
    assert first_sale.status_code == 201
    first_sale_id = first_sale.json()["id"]
    assert first_sale.json()["itens"][0]["fornecedor_id"] == original_supplier_id

    product_update = client.patch(
        f"/api/products/{product.id}",
        json={"fornecedor_id": second_supplier_id},
    )
    assert product_update.status_code == 200
    assert product_update.json()["fornecedor_id"] == second_supplier_id

    historical_sale = client.get(f"/api/sales/{first_sale_id}")
    assert historical_sale.status_code == 200
    assert historical_sale.json()["itens"][0]["fornecedor_id"] == original_supplier_id

    second_sale = client.post(
        "/api/sales",
        json={**sale_payload, "data_venda": "2026-08-19T17:00:00Z"},
    )
    assert second_sale.status_code == 201
    assert second_sale.json()["itens"][0]["fornecedor_id"] == second_supplier_id

    assert client.delete(f"/api/suppliers/{original_supplier_id}").status_code == 409

    assert client.delete(f"/api/sales/{first_sale_id}").status_code == 204
    assert session.get(Fornecedor, original_supplier_id) is not None
    assert session.get(Produto, product.id) is not None


def test_sale_creation_supports_multiple_items_and_history_keeps_price(
    client: TestClient,
    session,
) -> None:
    customer, employee, first_product = seed_sale_dependencies(session)
    second_product = Produto(
        nome="Segundo produto",
        categoria="Geral",
        preco_custo=Decimal("4.00"),
        preco_venda=Decimal("8.25"),
        fornecedor_id=first_product.fornecedor_id,
    )
    session.add(second_product)
    session.flush()

    response = client.post(
        "/api/sales",
        json={
            "cliente_id": customer.id,
            "funcionario_id": employee.id,
            "data_venda": "2026-08-19T11:00:00Z",
            "itens": [
                {"produto_id": first_product.id, "quantidade": "1.250"},
                {"produto_id": second_product.id, "quantidade": "2.000"},
            ],
        },
    )

    assert response.status_code == 201
    assert Decimal(str(response.json()["total"])) == Decimal("35.88")

    first_product.preco_venda = Decimal("20.00")
    session.commit()

    detail_response = client.get(f"/api/sales/{response.json()['id']}")
    assert detail_response.status_code == 200
    detail_items = detail_response.json()["itens"]
    prices_by_product = {
        item["produto"]["id"]: Decimal(str(item["preco_unitario"]))
        for item in detail_items
    }
    assert prices_by_product[first_product.id] == Decimal("15.50")
    assert prices_by_product[second_product.id] == Decimal("8.25")


def test_sales_list_and_missing_references_are_handled_atomically(
    client: TestClient,
    session,
) -> None:
    customer, employee, product = seed_sale_dependencies(session)
    existing_sale_ids = set(session.scalars(select(Venda.id)).all())
    payload = {
        "cliente_id": customer.id,
        "funcionario_id": employee.id,
        "data_venda": "2026-08-19T12:00:00Z",
        "itens": [{"produto_id": product.id, "quantidade": "1.000"}],
    }

    for field, value in (
        ("cliente_id", 999991),
        ("funcionario_id", 999992),
        ("itens", [{"produto_id": 999993, "quantidade": "1.000"}]),
    ):
        invalid_payload = {**payload, field: value}
        response = client.post("/api/sales", json=invalid_payload)
        assert response.status_code == 404

    assert set(session.scalars(select(Venda.id)).all()) == existing_sale_ids

    created = client.post("/api/sales", json=payload)
    assert created.status_code == 201
    list_response = client.get("/api/sales")
    assert list_response.status_code == 200
    listed_sale_ids = {sale["id"] for sale in list_response.json()}
    expected_sale_ids = existing_sale_ids | {created.json()["id"]}
    assert listed_sale_ids == expected_sale_ids


def test_sale_delete_removes_only_sale_and_items_and_preserves_references(
    client: TestClient,
    session,
) -> None:
    customer, employee, first_product = seed_sale_dependencies(session)
    second_product = Produto(
        nome="Segundo produto para exclusão",
        categoria="Geral",
        preco_custo=Decimal("4.00"),
        preco_venda=Decimal("8.25"),
        fornecedor_id=first_product.fornecedor_id,
    )
    session.add(second_product)
    session.flush()

    sale_payload = {
        "cliente_id": customer.id,
        "funcionario_id": employee.id,
        "data_venda": "2026-08-19T13:00:00Z",
        "itens": [
            {"produto_id": first_product.id, "quantidade": "1.000"},
            {"produto_id": second_product.id, "quantidade": "2.000"},
        ],
    }
    first_response = client.post("/api/sales", json=sale_payload)
    second_response = client.post(
        "/api/sales",
        json={**sale_payload, "data_venda": "2026-08-19T14:00:00Z"},
    )
    assert first_response.status_code == 201
    assert second_response.status_code == 201
    first_sale_id = first_response.json()["id"]
    second_sale_id = second_response.json()["id"]

    delete_response = client.delete(f"/api/sales/{first_sale_id}")

    assert delete_response.status_code == 204
    assert client.get(f"/api/sales/{first_sale_id}").status_code == 404
    assert client.get(f"/api/sales/{second_sale_id}").status_code == 200
    assert session.get(Venda, first_sale_id) is None
    assert session.scalars(
        select(VendaItem).where(VendaItem.venda_id == first_sale_id)
    ).all() == []
    assert session.get(Venda, second_sale_id) is not None
    assert session.get(Cliente, customer.id) is not None
    assert session.get(Funcionario, employee.id) is not None
    assert session.get(Fornecedor, first_product.fornecedor_id) is not None
    assert session.get(Produto, first_product.id) is not None
    assert session.get(Produto, second_product.id) is not None


def test_sale_delete_returns_404_for_missing_sale(client: TestClient) -> None:
    response = client.delete("/api/sales/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Venda não encontrada."


@pytest.mark.parametrize(
    "items",
    [
        [],
        [{"produto_id": 1, "quantidade": "0"}],
        [{"produto_id": 1, "quantidade": "-1.000"}],
        [
            {
                "produto_id": 1,
                "quantidade": "1.000",
                "preco_unitario": "10.00",
            }
        ],
        [
            {"produto_id": 1, "quantidade": "1.000"},
            {"produto_id": 1, "quantidade": "2.000"},
        ],
    ],
)
def test_sale_input_validation_returns_422(client: TestClient, items) -> None:
    response = client.post(
        "/api/sales",
        json={
            "cliente_id": 1,
            "funcionario_id": 1,
            "data_venda": "2026-08-19T10:00:00Z",
            "itens": items,
        },
    )

    assert response.status_code == 422
