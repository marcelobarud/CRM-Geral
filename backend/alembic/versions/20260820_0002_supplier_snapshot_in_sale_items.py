"""Adiciona o fornecedor histórico aos itens de venda.

Revision ID: 20260820_0002
Revises: 20260820_0001
"""

import sqlalchemy as sa

from alembic import op

revision = "20260820_0002"
down_revision = "20260820_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "venda_itens",
        sa.Column("fornecedor_id", sa.Integer(), nullable=True),
    )

    op.execute(
        sa.text(
            """
            UPDATE venda_itens AS venda_item
            SET fornecedor_id = produto.fornecedor_id
            FROM produtos AS produto
            WHERE produto.id = venda_item.produto_id
            """
        )
    )
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM venda_itens
                    WHERE fornecedor_id IS NULL
                ) THEN
                    RAISE EXCEPTION 'VendaItem sem fornecedor_id após backfill';
                END IF;
            END $$;
            """
        )
    )
    op.alter_column(
        "venda_itens",
        "fornecedor_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.create_foreign_key(
        "fk_venda_itens_fornecedor",
        "venda_itens",
        "fornecedores",
        ["fornecedor_id"],
        ["id"],
    )
    op.create_index(
        "ix_venda_itens_fornecedor_id",
        "venda_itens",
        ["fornecedor_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_venda_itens_fornecedor_id", table_name="venda_itens")
    op.drop_constraint(
        "fk_venda_itens_fornecedor",
        "venda_itens",
        type_="foreignkey",
    )
    op.drop_column("venda_itens", "fornecedor_id")
