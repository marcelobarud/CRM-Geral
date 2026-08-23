"""Definições e valores de campos personalizados, isolados por cadastro."""

from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CustomFieldDefinitionMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(80), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    opcoes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    obrigatorio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class CustomFieldValueMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    valor: Mapped[str | None] = mapped_column(String(500), nullable=True)


class ClienteCampo(CustomFieldDefinitionMixin, Base):
    __tablename__ = "cliente_campos"
    __table_args__ = (UniqueConstraint("nome", name="uq_cliente_campos_nome"),)
    valores: Mapped[list["ClienteCampoValor"]] = relationship(
        back_populates="campo", passive_deletes=True
    )


class ClienteCampoValor(CustomFieldValueMixin, Base):
    __tablename__ = "cliente_campos_valores"
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    campo_id: Mapped[int] = mapped_column(
        ForeignKey("cliente_campos.id"), nullable=False
    )
    campo: Mapped[ClienteCampo] = relationship(back_populates="valores")
    __table_args__ = (
        UniqueConstraint("cliente_id", "campo_id", name="uq_cliente_campo_valor"),
    )


class ProdutoCampo(CustomFieldDefinitionMixin, Base):
    __tablename__ = "produto_campos"
    __table_args__ = (UniqueConstraint("nome", name="uq_produto_campos_nome"),)
    valores: Mapped[list["ProdutoCampoValor"]] = relationship(
        back_populates="campo", passive_deletes=True
    )


class ProdutoCampoValor(CustomFieldValueMixin, Base):
    __tablename__ = "produto_campos_valores"
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    campo_id: Mapped[int] = mapped_column(
        ForeignKey("produto_campos.id"), nullable=False
    )
    campo: Mapped[ProdutoCampo] = relationship(back_populates="valores")
    __table_args__ = (
        UniqueConstraint("produto_id", "campo_id", name="uq_produto_campo_valor"),
    )


class FuncionarioCampo(CustomFieldDefinitionMixin, Base):
    __tablename__ = "funcionario_campos"
    __table_args__ = (UniqueConstraint("nome", name="uq_funcionario_campos_nome"),)
    valores: Mapped[list["FuncionarioCampoValor"]] = relationship(
        back_populates="campo", passive_deletes=True
    )


class FuncionarioCampoValor(CustomFieldValueMixin, Base):
    __tablename__ = "funcionario_campos_valores"
    funcionario_id: Mapped[int] = mapped_column(
        ForeignKey("funcionarios.id"), nullable=False
    )
    campo_id: Mapped[int] = mapped_column(
        ForeignKey("funcionario_campos.id"), nullable=False
    )
    campo: Mapped[FuncionarioCampo] = relationship(back_populates="valores")
    __table_args__ = (
        UniqueConstraint(
            "funcionario_id", "campo_id", name="uq_funcionario_campo_valor"
        ),
    )


class FornecedorCampo(CustomFieldDefinitionMixin, Base):
    __tablename__ = "fornecedor_campos"
    __table_args__ = (UniqueConstraint("nome", name="uq_fornecedor_campos_nome"),)
    valores: Mapped[list["FornecedorCampoValor"]] = relationship(
        back_populates="campo", passive_deletes=True
    )


class FornecedorCampoValor(CustomFieldValueMixin, Base):
    __tablename__ = "fornecedor_campos_valores"
    fornecedor_id: Mapped[int] = mapped_column(
        ForeignKey("fornecedores.id"), nullable=False
    )
    campo_id: Mapped[int] = mapped_column(
        ForeignKey("fornecedor_campos.id"), nullable=False
    )
    campo: Mapped[FornecedorCampo] = relationship(back_populates="valores")
    __table_args__ = (
        UniqueConstraint("fornecedor_id", "campo_id", name="uq_fornecedor_campo_valor"),
    )


CustomFieldDefinition = Any
