"""Adiciona a configuração persistente de aparência."""

import sqlalchemy as sa

from alembic import op

revision = "20260823_0001"
down_revision = "20260820_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "configuracoes_aparencia",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome_sistema", sa.String(length=120), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("cor_primaria", sa.String(length=7), nullable=False),
        sa.Column("cor_secundaria", sa.String(length=7), nullable=False),
        sa.Column("cor_destaque", sa.String(length=7), nullable=False),
        sa.Column("cor_fundo", sa.String(length=7), nullable=False),
        sa.Column("cor_superficie", sa.String(length=7), nullable=False),
        sa.Column("cor_texto", sa.String(length=7), nullable=False),
        sa.Column("raio_controle", sa.String(length=20), nullable=False),
        sa.Column("raio_card", sa.String(length=20), nullable=False),
        sa.Column("rotulo_dashboard", sa.String(length=80), nullable=False),
        sa.Column("rotulo_clientes", sa.String(length=80), nullable=False),
        sa.Column("rotulo_produtos", sa.String(length=80), nullable=False),
        sa.Column("rotulo_funcionarios", sa.String(length=80), nullable=False),
        sa.Column("rotulo_fornecedores", sa.String(length=80), nullable=False),
        sa.Column("rotulo_vendas", sa.String(length=80), nullable=False),
        sa.Column("rotulo_nova_venda", sa.String(length=80), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_configuracoes_aparencia_singleton"),
    )
    op.execute(
        sa.text(
            """
            INSERT INTO configuracoes_aparencia (
                id, nome_sistema, logo_url, cor_primaria, cor_secundaria,
                cor_destaque, cor_fundo, cor_superficie, cor_texto,
                raio_controle, raio_card, rotulo_dashboard, rotulo_clientes,
                rotulo_produtos, rotulo_funcionarios, rotulo_fornecedores,
                rotulo_vendas, rotulo_nova_venda
            ) VALUES (
                1, 'CRM Geral', NULL, '#487A98', '#2F5975', '#2F8065',
                '#EEF4F8', '#FFFFFF', '#1E293B', '0.75rem', '1.5rem',
                'Dashboard', 'Clientes', 'Produtos', 'Funcionários',
                'Fornecedores', 'Vendas', 'Nova venda'
            )
            """
        )
    )


def downgrade() -> None:
    op.drop_table("configuracoes_aparencia")
