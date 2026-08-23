from typing import Literal

from pydantic import Field, model_validator

from app.schemas.base import APIModel, ReadModel

CustomFieldType = Literal["text", "integer", "decimal", "date", "boolean", "select"]


class CustomFieldDefinitionCreate(APIModel):
    nome: str = Field(min_length=1, max_length=80)
    tipo: CustomFieldType
    opcoes: list[str] = Field(default_factory=list, max_length=50)
    obrigatorio: bool = False
    ativo: bool = True
    ordem: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_options(self) -> "CustomFieldDefinitionCreate":
        self.opcoes = [option.strip() for option in self.opcoes if option.strip()]
        if self.tipo == "select" and not self.opcoes:
            raise ValueError("Campos do tipo select precisam de opções.")
        if self.tipo != "select" and self.opcoes:
            raise ValueError("Somente campos select podem possuir opções.")
        if len(self.opcoes) != len(set(self.opcoes)):
            raise ValueError("As opções do campo devem ser únicas.")
        return self


class CustomFieldDefinitionUpdate(APIModel):
    nome: str | None = Field(default=None, min_length=1, max_length=80)
    tipo: CustomFieldType | None = None
    opcoes: list[str] | None = Field(default=None, max_length=50)
    obrigatorio: bool | None = None
    ativo: bool | None = None
    ordem: int | None = Field(default=None, ge=0)


class CustomFieldDefinitionRead(ReadModel):
    id: int
    nome: str
    tipo: CustomFieldType
    opcoes: list[str] = Field(default_factory=list)
    obrigatorio: bool
    ativo: bool
    ordem: int


class CustomFieldValueRead(ReadModel):
    campo_id: int
    nome: str
    tipo: CustomFieldType
    opcoes: list[str] = Field(default_factory=list)
    obrigatorio: bool
    ativo: bool
    ordem: int
    valor: str | int | float | bool | None
