from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, inspect

from app.models import (
    Cliente,
    Fornecedor,
    Funcionario,
    Produto,
    Venda,
    VendaItem,
)

EXPECTED_COLUMNS = {
    "clientes": {
        "id",
        "nome",
        "cidade",
        "estado",
        "rua",
        "numero",
        "complemento",
    },
    "fornecedores": {
        "id",
        "nome",
        "cidade",
        "estado",
        "rua",
        "numero",
        "cnpj",
        "complemento",
    },
    "funcionarios": {
        "id",
        "nome_completo",
        "cidade",
        "estado",
        "rua",
        "numero",
        "cpf",
        "data_nascimento",
        "complemento",
        "rg",
        "ativo",
    },
    "produtos": {
        "id",
        "nome",
        "categoria",
        "preco_custo",
        "preco_venda",
        "fornecedor_id",
    },
    "vendas": {"id", "cliente_id", "funcionario_id", "data_venda"},
    "venda_itens": {
        "id",
        "venda_id",
        "produto_id",
        "quantidade",
        "preco_unitario",
        "fornecedor_id",
    },
}


def test_v1_tables_have_exactly_the_approved_columns() -> None:
    assert set(EXPECTED_COLUMNS) == set(Cliente.metadata.tables)

    for table_name, expected_columns in EXPECTED_COLUMNS.items():
        assert (
            set(Cliente.metadata.tables[table_name].columns.keys())
            == expected_columns
        )


def test_only_approved_columns_are_nullable() -> None:
    nullable_columns = {
        table_name: {
            column.name
            for column in table.columns
            if column.nullable
        }
        for table_name, table in Cliente.metadata.tables.items()
    }

    assert nullable_columns == {
        "clientes": {"complemento"},
        "fornecedores": {"complemento"},
        "funcionarios": {"complemento", "rg"},
        "produtos": set(),
        "vendas": set(),
        "venda_itens": set(),
    }


def test_money_and_date_types_are_explicit() -> None:
    produtos = Cliente.metadata.tables["produtos"]
    itens = Cliente.metadata.tables["venda_itens"]
    funcionarios = Cliente.metadata.tables["funcionarios"]
    vendas = Cliente.metadata.tables["vendas"]

    for column_name in ("preco_custo", "preco_venda"):
        column_type = produtos.c[column_name].type
        assert isinstance(column_type, Numeric)
        assert (column_type.precision, column_type.scale) == (12, 2)

    item_price_type = itens.c.preco_unitario.type
    quantity_type = itens.c.quantidade.type
    supplier_id_type = itens.c.fornecedor_id.type
    assert isinstance(item_price_type, Numeric)
    assert (item_price_type.precision, item_price_type.scale) == (12, 2)
    assert isinstance(quantity_type, Numeric)
    assert (quantity_type.precision, quantity_type.scale) == (12, 3)
    assert isinstance(supplier_id_type, Integer)
    assert itens.c.fornecedor_id.nullable is False
    assert isinstance(funcionarios.c.data_nascimento.type, Date)
    assert isinstance(funcionarios.c.ativo.type, Boolean)
    assert funcionarios.c.ativo.nullable is False
    assert funcionarios.c.ativo.default.arg is True
    assert funcionarios.c.ativo.server_default is not None
    assert isinstance(vendas.c.data_venda.type, DateTime)
    assert vendas.c.data_venda.type.timezone is True


def test_constraints_and_foreign_keys_are_named_and_restrictive() -> None:
    expected_constraints = {
        "produtos": {
            "ck_produtos_preco_custo_nao_negativo",
            "ck_produtos_preco_venda_nao_negativo",
        },
        "venda_itens": {
            "ck_venda_itens_quantidade_positiva",
            "ck_venda_itens_preco_unitario_nao_negativo",
        },
    }

    for table_name, constraint_names in expected_constraints.items():
        table = Cliente.metadata.tables[table_name]
        actual_names = {
            constraint.name
            for constraint in table.constraints
            if constraint.name is not None
        }
        assert constraint_names <= actual_names

    assert {
        constraint.name
        for constraint in Cliente.metadata.tables["fornecedores"].constraints
    } >= {"uq_fornecedores_cnpj"}
    assert {
        constraint.name
        for constraint in Cliente.metadata.tables["funcionarios"].constraints
    } >= {"uq_funcionarios_cpf"}
    supplier_foreign_keys = Cliente.metadata.tables[
        "venda_itens"
    ].foreign_key_constraints
    assert any(
        foreign_key.column_keys == ["fornecedor_id"]
        and str(foreign_key.elements[0].target_fullname)
        == "fornecedores.id"
        for foreign_key in supplier_foreign_keys
    )

    for table in Cliente.metadata.tables.values():
        for foreign_key in table.foreign_key_constraints:
            assert foreign_key.ondelete is None


def test_relationships_do_not_configure_delete_cascades() -> None:
    for model in (Cliente, Fornecedor, Funcionario, Produto, Venda, VendaItem):
        mapper = inspect(model)
        for relationship in mapper.relationships:
            assert "delete" not in relationship.cascade
            assert "delete-orphan" not in relationship.cascade
