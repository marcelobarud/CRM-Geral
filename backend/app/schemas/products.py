from decimal import Decimal

from pydantic import Field, model_validator

from app.schemas.base import APIModel, ReadModel


class ProdutoCreate(APIModel):
    nome: str = Field(min_length=1, max_length=255)
    categoria: str = Field(min_length=1, max_length=100)
    preco_custo: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    preco_venda: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    fornecedor_id: int = Field(gt=0)


class ProdutoUpdate(APIModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    categoria: str | None = Field(default=None, min_length=1, max_length=100)
    preco_custo: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    preco_venda: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    fornecedor_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def reject_null_required_fields(self) -> "ProdutoUpdate":
        required_fields = (
            "nome",
            "categoria",
            "preco_custo",
            "preco_venda",
            "fornecedor_id",
        )
        for field_name in required_fields:
            if (
                field_name in self.model_fields_set
                and getattr(self, field_name) is None
            ):
                raise ValueError(f"{field_name} não pode ser nulo.")
        return self


class ProdutoRead(ReadModel):
    id: int
    nome: str
    categoria: str
    preco_custo: Decimal
    preco_venda: Decimal
    fornecedor_id: int
