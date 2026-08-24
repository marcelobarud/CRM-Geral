"""Adiciona tokens semânticos e overrides visuais por página."""

import sqlalchemy as sa

from alembic import op

revision = "20260823_0003"
down_revision = "20260823_0002"
branch_labels = None
depends_on = None

GLOBAL_COLUMNS = {
    "cor_texto_primario": "#1E293B",
    "cor_texto_secundario": "#4B6575",
    "cor_texto_mudo": "#718096",
    "cor_titulo": "#1E293B",
    "cor_link": "#2F5975",
    "cor_sobre_primaria": "#FFFFFF",
    "cor_sobre_secundaria": "#2F5975",
    "cor_sobre_destaque": "#FFFFFF",
    "cor_tabela_cabecalho": "#2F5975",
    "cor_tabela_corpo": "#1E293B",
    "cor_tabela_fundo": "#FFFFFF",
    "cor_tabela_borda": "#DCE7EE",
    "cor_perigo": "#B95353",
    "cor_sucesso": "#2F8065",
    "cor_aviso": "#9A7441",
}

PAGE_COLUMNS = (
    "cor_fundo",
    "cor_superficie",
    "cor_titulo",
    "cor_texto_primario",
    "cor_texto_secundario",
    "cor_texto_mudo",
    "cor_destaque",
    "cor_link",
)


def upgrade() -> None:
    for column_name, default in GLOBAL_COLUMNS.items():
        op.add_column(
            "configuracoes_aparencia",
            sa.Column(column_name, sa.String(length=7), nullable=True),
        )
        op.execute(
            sa.text(
                f"UPDATE configuracoes_aparencia SET {column_name} = :value"
            ).bindparams(value=default)
        )
        op.alter_column("configuracoes_aparencia", column_name, nullable=False)

    columns = [
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pagina", sa.String(length=32), nullable=False),
        *[
            sa.Column(column_name, sa.String(length=7), nullable=True)
            for column_name in PAGE_COLUMNS
        ],
        sa.UniqueConstraint("pagina", name="uq_config_aparencia_paginas_pagina"),
        sa.CheckConstraint(
            "pagina IN ('dashboard', 'customers', 'products', 'employees', "
            "'suppliers', 'sales', 'new_sale', 'settings')",
            name="ck_config_aparencia_paginas_pagina",
        ),
    ]
    op.create_table("configuracoes_aparencia_paginas", *columns)


def downgrade() -> None:
    op.drop_table("configuracoes_aparencia_paginas")
    for column_name in reversed(tuple(GLOBAL_COLUMNS)):
        op.drop_column("configuracoes_aparencia", column_name)
