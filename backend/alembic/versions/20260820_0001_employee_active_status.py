"""Adiciona status ativo aos funcionários.

Revision ID: 20260820_0001
Revises: 20260818_0001
"""

from alembic import op
import sqlalchemy as sa


revision = "20260820_0001"
down_revision = "20260818_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "funcionarios",
        sa.Column(
            "ativo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("funcionarios", "ativo")
