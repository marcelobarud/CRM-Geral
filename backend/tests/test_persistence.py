import os
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, func, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Cliente, Fornecedor, Funcionario, Produto, Venda, VendaItem

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
REQUIRED_TABLES = {
    "alembic_version",
    "clientes",
    "fornecedores",
    "funcionarios",
    "produtos",
    "vendas",
    "venda_itens",
}
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="defina TEST_DATABASE_URL para executar os testes PostgreSQL",
)


@pytest.fixture(scope="session")
def test_engine():
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL não foi definida")
    database_url = make_url(TEST_DATABASE_URL)
    if (
        database_url.get_backend_name() != "postgresql"
        or database_url.get_driver_name() != "psycopg"
    ):
        pytest.fail("TEST_DATABASE_URL deve usar PostgreSQL com o driver psycopg")
    if not database_url.database or not database_url.database.endswith("_test"):
        pytest.fail("TEST_DATABASE_URL deve apontar para um banco com sufixo _test")

    engine = create_engine(TEST_DATABASE_URL)
    try:
        with engine.connect() as connection:
            connection.execute(select(1))
    except Exception:
        engine.dispose()
        pytest.fail(
            "Não foi possível conectar ao PostgreSQL de teste; "
            "verifique TEST_DATABASE_URL, o serviço e as credenciais locais."
        )

    with engine.connect() as connection:
        missing_tables = REQUIRED_TABLES - set(inspect(connection).get_table_names())
        if missing_tables:
            engine.dispose()
            pytest.fail(
                "O banco de teste não está em head; execute alembic upgrade head "
                "antes da suíte de persistência."
            )
        applied_versions = set(
            connection.execute(text("SELECT version_num FROM alembic_version"))
            .scalars()
            .all()
        )
        if applied_versions != {"20260818_0001"}:
            engine.dispose()
            pytest.fail("A migration da Fase 3 não está aplicada em head")
    yield engine
    engine.dispose()


@pytest.fixture
def session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    database_session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )
    try:
        yield database_session
    finally:
        database_session.close()
        transaction.rollback()
        connection.close()


def make_supplier() -> Fornecedor:
    return Fornecedor(
        nome="Fornecedor de teste",
        cidade="São Paulo",
        estado="SP",
        rua="Rua A",
        numero="10A",
        cnpj="12.345.678/0001-90",
    )


def make_customer() -> Cliente:
    return Cliente(
        nome="Cliente de teste",
        cidade="São Paulo",
        estado="SP",
        rua="Rua B",
        numero="S/N",
    )


def make_employee() -> Funcionario:
    return Funcionario(
        nome_completo="Funcionário de teste",
        cidade="São Paulo",
        estado="SP",
        rua="Rua C",
        numero="20",
        cpf="123.456.789-09",
        data_nascimento=date(1990, 1, 1),
    )


def make_product(supplier: Fornecedor, name: str = "Produto de teste") -> Produto:
    return Produto(
        nome=name,
        categoria="Geral",
        preco_custo=Decimal("10.00"),
        preco_venda=Decimal("15.50"),
        fornecedor=supplier,
    )


def test_can_persist_all_entities_and_multiple_items(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product_one = make_product(supplier, "Produto 1")
    product_two = make_product(supplier, "Produto 2")
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto=product_one,
                quantidade=Decimal("2.000"),
                preco_unitario=Decimal("15.50"),
            ),
            VendaItem(
                produto=product_two,
                quantidade=Decimal("1.500"),
                preco_unitario=Decimal("20.00"),
            ),
        ],
    )

    session.add(sale)
    session.commit()

    assert supplier.id is not None
    assert customer.id is not None
    assert employee.id is not None
    assert product_one.id is not None
    assert sale.id is not None
    assert len(sale.itens) == 2
    assert sale.itens[0].preco_unitario == Decimal("15.50")
    assert employee.rg is None
    assert customer.complemento is None


def test_database_rejects_null_in_required_column(session: Session) -> None:
    supplier = make_supplier()
    invalid_product = Produto(
        nome="Produto inválido",
        categoria="Geral",
        preco_custo=Decimal("10.00"),
        preco_venda=None,
        fornecedor=supplier,
    )
    session.add(invalid_product)

    with pytest.raises(IntegrityError):
        session.commit()


def test_database_accepts_null_optional_fields(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()

    session.add_all([supplier, customer, employee])
    session.commit()

    assert supplier.complemento is None
    assert customer.complemento is None
    assert employee.complemento is None
    assert employee.rg is None


def test_duplicate_cpf_is_rejected(session: Session) -> None:
    first = make_employee()
    second = make_employee()
    second.nome_completo = "Outro funcionário"

    session.add_all([first, second])

    with pytest.raises(IntegrityError):
        session.commit()


def test_duplicate_cnpj_is_rejected(session: Session) -> None:
    first = make_supplier()
    second = make_supplier()
    second.nome = "Outro fornecedor"

    session.add_all([first, second])

    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("preco_custo", Decimal("-0.01")),
        ("preco_venda", Decimal("-0.01")),
    ],
)
def test_negative_product_prices_are_rejected(
    session: Session,
    field: str,
    value: Decimal,
) -> None:
    supplier = make_supplier()
    product = make_product(supplier)
    setattr(product, field, value)
    session.add(product)

    with pytest.raises(IntegrityError):
        session.commit()


@pytest.mark.parametrize("quantity", [Decimal("0"), Decimal("-1")])
def test_non_positive_quantities_are_rejected(
    session: Session,
    quantity: Decimal,
) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product = make_product(supplier)
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto=product,
                quantidade=quantity,
                preco_unitario=Decimal("15.50"),
            )
        ],
    )
    session.add(sale)

    with pytest.raises(IntegrityError):
        session.commit()


def test_negative_item_price_is_rejected(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product = make_product(supplier)
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto=product,
                quantidade=Decimal("1.000"),
                preco_unitario=Decimal("-0.01"),
            )
        ],
    )
    session.add(sale)

    with pytest.raises(IntegrityError):
        session.commit()


def test_invalid_product_supplier_foreign_key_is_rejected(session: Session) -> None:
    product = Produto(
        nome="Produto sem fornecedor",
        categoria="Geral",
        preco_custo=Decimal("10.00"),
        preco_venda=Decimal("15.50"),
        fornecedor_id=999999,
    )
    session.add(product)

    with pytest.raises(IntegrityError):
        session.commit()


def test_invalid_sale_customer_foreign_key_is_rejected(session: Session) -> None:
    employee = make_employee()
    session.add(employee)
    session.flush()
    sale = Venda(
        cliente_id=999999,
        funcionario_id=employee.id,
        data_venda=datetime.now(timezone.utc),
    )
    session.add(sale)

    with pytest.raises(IntegrityError):
        session.commit()


def test_invalid_sale_employee_foreign_key_is_rejected(session: Session) -> None:
    customer = make_customer()
    session.add(customer)
    session.flush()
    sale = Venda(
        cliente_id=customer.id,
        funcionario_id=999999,
        data_venda=datetime.now(timezone.utc),
    )
    session.add(sale)

    with pytest.raises(IntegrityError):
        session.commit()


def test_invalid_item_sale_foreign_key_is_rejected(session: Session) -> None:
    supplier = make_supplier()
    product = make_product(supplier)
    session.add(product)
    session.flush()
    item = VendaItem(
        venda_id=999999,
        produto_id=product.id,
        quantidade=Decimal("1.000"),
        preco_unitario=Decimal("15.50"),
    )
    session.add(item)

    with pytest.raises(IntegrityError):
        session.commit()


def test_invalid_item_product_foreign_key_is_rejected(session: Session) -> None:
    customer = make_customer()
    employee = make_employee()
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
    )
    session.add(sale)
    session.flush()
    item = VendaItem(
        venda_id=sale.id,
        produto_id=999999,
        quantidade=Decimal("1.000"),
        preco_unitario=Decimal("15.50"),
    )
    session.add(item)

    with pytest.raises(IntegrityError):
        session.commit()


def test_referenced_records_cannot_be_deleted(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product = make_product(supplier)
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto=product,
                quantidade=Decimal("1.000"),
                preco_unitario=Decimal("15.50"),
            )
        ],
    )
    session.add(sale)
    session.commit()

    session.delete(product)

    with pytest.raises(IntegrityError):
        session.commit()


def test_referenced_customer_cannot_be_deleted(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product = make_product(supplier)
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
        itens=[
            VendaItem(
                produto=product,
                quantidade=Decimal("1.000"),
                preco_unitario=Decimal("15.50"),
            )
        ],
    )
    session.add(sale)
    session.commit()

    session.delete(customer)

    with pytest.raises(IntegrityError):
        session.commit()


def test_same_sale_can_have_multiple_items(session: Session) -> None:
    supplier = make_supplier()
    customer = make_customer()
    employee = make_employee()
    product_one = make_product(supplier, "Produto 1")
    product_two = make_product(supplier, "Produto 2")
    sale = Venda(
        cliente=customer,
        funcionario=employee,
        data_venda=datetime.now(timezone.utc),
    )
    sale.itens.extend(
        [
            VendaItem(
                produto=product_one,
                quantidade=Decimal("1.000"),
                preco_unitario=Decimal("10.00"),
            ),
            VendaItem(
                produto=product_two,
                quantidade=Decimal("2.000"),
                preco_unitario=Decimal("12.00"),
            ),
        ]
    )
    session.add(sale)
    session.commit()

    item_count = session.scalar(
        select(func.count(VendaItem.id)).where(VendaItem.venda_id == sale.id)
    )
    assert item_count == 2
