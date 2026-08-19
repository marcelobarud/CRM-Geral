import os

import pytest
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

REQUIRED_TABLES = {
    "alembic_version",
    "clientes",
    "fornecedores",
    "funcionarios",
    "produtos",
    "vendas",
    "venda_itens",
}


@pytest.fixture(scope="session")
def test_engine():
    test_database_url = os.getenv("TEST_DATABASE_URL")
    if test_database_url is None:
        pytest.skip("TEST_DATABASE_URL não foi definida")
    try:
        database_url = make_url(test_database_url)
    except Exception:
        pytest.fail("TEST_DATABASE_URL possui formato inválido")
    if (
        database_url.get_backend_name() != "postgresql"
        or database_url.get_driver_name() != "psycopg"
    ):
        pytest.fail("TEST_DATABASE_URL deve usar PostgreSQL com o driver psycopg")
    if not database_url.database or not database_url.database.endswith("_test"):
        pytest.fail("TEST_DATABASE_URL deve apontar para um banco com sufixo _test")

    engine = create_engine(test_database_url)
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
