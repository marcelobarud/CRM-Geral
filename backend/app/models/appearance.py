"""Configuração persistente da identidade visual do CRM."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppearanceSettings(Base):
    __tablename__ = "configuracoes_aparencia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome_sistema: Mapped[str] = mapped_column(String(120), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cor_primaria: Mapped[str] = mapped_column(String(7), nullable=False)
    cor_secundaria: Mapped[str] = mapped_column(String(7), nullable=False)
    cor_destaque: Mapped[str] = mapped_column(String(7), nullable=False)
    cor_fundo: Mapped[str] = mapped_column(String(7), nullable=False)
    cor_superficie: Mapped[str] = mapped_column(String(7), nullable=False)
    cor_texto: Mapped[str] = mapped_column(String(7), nullable=False)
    raio_controle: Mapped[str] = mapped_column(String(20), nullable=False)
    raio_card: Mapped[str] = mapped_column(String(20), nullable=False)
    rotulo_dashboard: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_clientes: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_produtos: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_funcionarios: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_fornecedores: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_vendas: Mapped[str] = mapped_column(String(80), nullable=False)
    rotulo_nova_venda: Mapped[str] = mapped_column(String(80), nullable=False)
