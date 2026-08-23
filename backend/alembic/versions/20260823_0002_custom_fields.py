"""Adiciona campos personalizados isolados por cadastro."""

import sqlalchemy as sa

from alembic import op

revision = "20260823_0002"
down_revision = "20260823_0001"
branch_labels = None
depends_on = None


def _create_domain(
    definition_table: str,
    value_table: str,
    entity_table: str,
    entity_column: str,
    unique_name: str,
    value_unique_name: str,
) -> None:
    op.create_table(
        definition_table,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("opcoes", sa.JSON(), nullable=True),
        sa.Column(
            "obrigatorio", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("nome", name=unique_name),
    )
    op.create_table(
        value_table,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(entity_column, sa.Integer(), nullable=False),
        sa.Column("campo_id", sa.Integer(), nullable=False),
        sa.Column("valor", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint([entity_column], [f"{entity_table}.id"]),
        sa.ForeignKeyConstraint(["campo_id"], [f"{definition_table}.id"]),
        sa.UniqueConstraint(entity_column, "campo_id", name=value_unique_name),
    )


def upgrade() -> None:
    _create_domain(
        "cliente_campos",
        "cliente_campos_valores",
        "clientes",
        "cliente_id",
        "uq_cliente_campos_nome",
        "uq_cliente_campo_valor",
    )
    _create_domain(
        "produto_campos",
        "produto_campos_valores",
        "produtos",
        "produto_id",
        "uq_produto_campos_nome",
        "uq_produto_campo_valor",
    )
    _create_domain(
        "funcionario_campos",
        "funcionario_campos_valores",
        "funcionarios",
        "funcionario_id",
        "uq_funcionario_campos_nome",
        "uq_funcionario_campo_valor",
    )
    _create_domain(
        "fornecedor_campos",
        "fornecedor_campos_valores",
        "fornecedores",
        "fornecedor_id",
        "uq_fornecedor_campos_nome",
        "uq_fornecedor_campo_valor",
    )


def downgrade() -> None:
    op.drop_table("fornecedor_campos_valores")
    op.drop_table("fornecedor_campos")
    op.drop_table("funcionario_campos_valores")
    op.drop_table("funcionario_campos")
    op.drop_table("produto_campos_valores")
    op.drop_table("produto_campos")
    op.drop_table("cliente_campos_valores")
    op.drop_table("cliente_campos")
