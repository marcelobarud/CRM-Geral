import importlib.util
from pathlib import Path
from unittest.mock import Mock

import sqlalchemy as sa

MIGRATION_PATH = (
    Path(__file__).parents[1]
    / "alembic"
    / "versions"
    / "20260820_0002_supplier_snapshot_in_sale_items.py"
)


def load_migration():
    spec = importlib.util.spec_from_file_location("phase13_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_phase13_migration_revision_chain_is_short_and_sequential() -> None:
    migration = load_migration()

    assert migration.revision == "20260820_0002"
    assert len(migration.revision) <= 32
    assert migration.down_revision == "20260820_0001"


def test_phase13_migration_adds_backfills_validates_and_constrains_supplier() -> None:
    migration = load_migration()
    migration.op = Mock()

    migration.upgrade()

    add_column = migration.op.add_column.call_args.args
    assert add_column[0] == "venda_itens"
    assert add_column[1].name == "fornecedor_id"
    assert add_column[1].nullable is True

    executed_sql = [
        statement.args[0].text
        for statement in migration.op.execute.call_args_list
        if isinstance(statement.args[0], sa.sql.elements.TextClause)
    ]
    assert any("UPDATE venda_itens" in statement for statement in executed_sql)
    assert any("fornecedor_id IS NULL" in statement for statement in executed_sql)

    assert migration.op.alter_column.call_count == 1
    alter_column = migration.op.alter_column.call_args
    assert alter_column.args == ("venda_itens", "fornecedor_id")
    assert isinstance(alter_column.kwargs["existing_type"], sa.Integer)
    assert alter_column.kwargs["nullable"] is False
    migration.op.create_foreign_key.assert_called_once_with(
        "fk_venda_itens_fornecedor",
        "venda_itens",
        "fornecedores",
        ["fornecedor_id"],
        ["id"],
    )
    migration.op.create_index.assert_called_once_with(
        "ix_venda_itens_fornecedor_id",
        "venda_itens",
        ["fornecedor_id"],
        unique=False,
    )


def test_phase13_migration_downgrade_removes_only_its_schema_objects() -> None:
    migration = load_migration()
    migration.op = Mock()

    migration.downgrade()

    migration.op.drop_index.assert_called_once_with(
        "ix_venda_itens_fornecedor_id",
        table_name="venda_itens",
    )
    migration.op.drop_constraint.assert_called_once_with(
        "fk_venda_itens_fornecedor",
        "venda_itens",
        type_="foreignkey",
    )
    migration.op.drop_column.assert_called_once_with(
        "venda_itens",
        "fornecedor_id",
    )
