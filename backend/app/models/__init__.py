"""Models SQLAlchemy do domínio mínimo da V1."""

from app.models.entities import (
    Cliente,
    Fornecedor,
    Funcionario,
    Produto,
    Venda,
    VendaItem,
)

__all__ = [
    "Cliente",
    "Fornecedor",
    "Funcionario",
    "Produto",
    "Venda",
    "VendaItem",
]
