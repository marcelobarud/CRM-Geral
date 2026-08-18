import os
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import Cliente, Fornecedor, Funcionario, Produto, Venda, VendaItem

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="defina TEST_DATABASE_URL para executar os testes PostgreSQL",
)


@pytest.fixture(scope="session")
def test_engine():
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL não foi definida")
    if not TEST_DATABASE_URL.startswith("postgresql+psycopg://"):
        pytest.fail("TEST_DATABASE_URL deve usar PostgreSQL com o driver psycopg")

    engine = create_engine(TEST_DATABASE_URL)
    try:
        with engine.connect() as connection:
            connection.execute(select(1))
    except OperationalError as exception:
        engine.dispose()
        pytest.skip(f"PostgreSQL de teste indisponível: {exception}")

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    database_session = Session(bind=connection)
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


def test_invalid_foreign_key_is_rejected(session: Session) -> None:
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
