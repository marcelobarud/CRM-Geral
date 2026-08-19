from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.customers import ClienteCreate, ClienteUpdate
from app.schemas.employees import FuncionarioCreate
from app.schemas.products import ProdutoCreate


def test_create_schemas_reject_manual_ids_and_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        ClienteCreate(
            id=10,
            nome="Cliente",
            cidade="São Paulo",
            estado="SP",
            rua="Rua A",
            numero="10",
        )


def test_product_schema_rejects_negative_prices() -> None:
    with pytest.raises(ValidationError):
        ProdutoCreate(
            nome="Produto",
            categoria="Geral",
            preco_custo=Decimal("-0.01"),
            preco_venda=Decimal("10.00"),
            fornecedor_id=1,
        )


def test_employee_schema_keeps_rg_and_complement_optional() -> None:
    employee = FuncionarioCreate(
        nome_completo="Funcionário",
        cidade="São Paulo",
        estado="SP",
        rua="Rua A",
        numero="10",
        cpf="123.456.789-09",
        data_nascimento=date(1990, 1, 1),
    )

    assert employee.rg is None
    assert employee.complemento is None


def test_patch_schema_rejects_null_required_fields() -> None:
    with pytest.raises(ValidationError):
        ClienteUpdate(nome=None)
