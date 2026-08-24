"""Adiciona overrides visuais tipados por elemento."""

import sqlalchemy as sa

from alembic import op

revision = "20260823_0004"
down_revision = "20260823_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "configuracoes_aparencia_elementos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customization_key", sa.String(length=120), nullable=False),
        sa.Column("customization_type", sa.String(length=16), nullable=False),
        sa.Column("customization_group", sa.String(length=80), nullable=True),
        sa.Column("pagina", sa.String(length=32), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.UniqueConstraint(
            "customization_key",
            name="uq_config_aparencia_elementos_key",
        ),
        sa.CheckConstraint(
            "customization_type IN ('TEXT', 'SURFACE', 'BUTTON', 'INPUT', 'TABLE', 'PAGE')",
            name="ck_config_aparencia_elementos_type",
        ),
    )


def downgrade() -> None:
    op.drop_table("configuracoes_aparencia_elementos")
