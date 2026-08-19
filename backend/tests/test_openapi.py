from fastapi.testclient import TestClient

from app.main import app


def test_openapi_lists_sales_routes_and_sale_request_contract() -> None:
    client = TestClient(app)

    assert client.get("/docs").status_code == 200
    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/health" in paths
    assert "/api/sales" in paths
    assert "/api/sales/{sale_id}" in paths
    assert "get" in paths["/api/sales"]
    assert "post" in paths["/api/sales"]
    assert "get" in paths["/api/sales/{sale_id}"]

    sale_schema = response.json()["components"]["schemas"]["VendaCreate"]
    assert set(sale_schema["required"]) == {
        "cliente_id",
        "funcionario_id",
        "data_venda",
        "itens",
    }
    assert "preco_unitario" not in sale_schema["properties"]
