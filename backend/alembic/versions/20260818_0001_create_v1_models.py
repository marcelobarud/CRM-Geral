"""Create the V1 relational model.

Revision ID: 20260818_0001
Revises:
Create Date: 2026-08-18
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260818_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "clientes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("cidade", sa.String(length=100), nullable=False),
        sa.Column("estado", sa.String(length=2), nullable=False),
        sa.Column("rua", sa.String(length=255), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("complemento", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "fornecedores",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("cidade", sa.String(length=100), nullable=False),
        sa.Column("estado", sa.String(length=2), nullable=False),
        sa.Column("rua", sa.String(length=255), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("cnpj", sa.String(length=18), nullable=False),
        sa.Column("complemento", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cnpj", name="uq_fornecedores_cnpj"),
    )
    op.create_table(
        "funcionarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome_completo", sa.String(length=255), nullable=False),
        sa.Column("cidade", sa.String(length=100), nullable=False),
        sa.Column("estado", sa.String(length=2), nullable=False),
        sa.Column("rua", sa.String(length=255), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("cpf", sa.String(length=14), nullable=False),
        sa.Column("data_nascimento", sa.Date(), nullable=False),
        sa.Column("complemento", sa.String(length=255), nullable=True),
        sa.Column("rg", sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cpf", name="uq_funcionarios_cpf"),
    )
    op.create_table(
        "produtos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("categoria", sa.String(length=100), nullable=False),
        sa.Column("preco_custo", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("preco_venda", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("fornecedor_id", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "preco_custo >= 0",
            name="ck_produtos_preco_custo_nao_negativo",
        ),
        sa.CheckConstraint(
            "preco_venda >= 0",
            name="ck_produtos_preco_venda_nao_negativo",
        ),
        sa.ForeignKeyConstraint(["fornecedor_id"], ["fornecedores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_produtos_fornecedor_id",
        "produtos",
        ["fornecedor_id"],
        unique=False,
    )
    op.create_table(
        "vendas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("funcionario_id", sa.Integer(), nullable=False),
        sa.Column("data_venda", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"]),
        sa.ForeignKeyConstraint(["funcionario_id"], ["funcionarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_vendas_cliente_id",
        "vendas",
        ["cliente_id"],
        unique=False,
    )
    op.create_index(
        "ix_vendas_funcionario_id",
        "vendas",
        ["funcionario_id"],
        unique=False,
    )
    op.create_table(
        "venda_itens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("venda_id", sa.Integer(), nullable=False),
        sa.Column("produto_id", sa.Integer(), nullable=False),
        sa.Column("quantidade", sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column(
            "preco_unitario",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.CheckConstraint(
            "quantidade > 0",
            name="ck_venda_itens_quantidade_positiva",
        ),
        sa.CheckConstraint(
            "preco_unitario >= 0",
            name="ck_venda_itens_preco_unitario_nao_negativo",
        ),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"]),
        sa.ForeignKeyConstraint(["venda_id"], ["vendas.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venda_itens_produto_id",
        "venda_itens",
        ["produto_id"],
        unique=False,
    )
    op.create_index(
        "ix_venda_itens_venda_id",
        "venda_itens",
        ["venda_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_venda_itens_venda_id", table_name="venda_itens")
    op.drop_index("ix_venda_itens_produto_id", table_name="venda_itens")
    op.drop_table("venda_itens")
    op.drop_index("ix_vendas_funcionario_id", table_name="vendas")
    op.drop_index("ix_vendas_cliente_id", table_name="vendas")
    op.drop_table("vendas")
    op.drop_index("ix_produtos_fornecedor_id", table_name="produtos")
    op.drop_table("produtos")
    op.drop_table("funcionarios")
    op.drop_table("fornecedores")
    op.drop_table("clientes")
