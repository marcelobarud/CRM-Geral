from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.custom_fields import (
    ClienteCampo,
    ClienteCampoValor,
    FornecedorCampo,
    FornecedorCampoValor,
    FuncionarioCampo,
    FuncionarioCampoValor,
    ProdutoCampo,
    ProdutoCampoValor,
)


@dataclass(frozen=True)
class CustomFieldDomain:
    definition_model: type[Any]
    value_model: type[Any]
    entity_id_name: str


CUSTOM_FIELD_DOMAINS = {
    "customers": CustomFieldDomain(ClienteCampo, ClienteCampoValor, "cliente_id"),
    "products": CustomFieldDomain(ProdutoCampo, ProdutoCampoValor, "produto_id"),
    "employees": CustomFieldDomain(
        FuncionarioCampo, FuncionarioCampoValor, "funcionario_id"
    ),
    "suppliers": CustomFieldDomain(
        FornecedorCampo, FornecedorCampoValor, "fornecedor_id"
    ),
}


class CustomFieldValidationError(ValueError):
    pass


def _options(definition: Any) -> list[str]:
    return list(definition.opcoes or [])


def list_definitions(db: Session, domain: CustomFieldDomain) -> list[dict[str, Any]]:
    definitions = db.scalars(
        select(domain.definition_model).order_by(
            domain.definition_model.ordem,
            domain.definition_model.id,
        )
    ).all()
    return [
        {
            "id": definition.id,
            "nome": definition.nome,
            "tipo": definition.tipo,
            "opcoes": _options(definition),
            "obrigatorio": definition.obrigatorio,
            "ativo": definition.ativo,
            "ordem": definition.ordem,
        }
        for definition in definitions
    ]


def _normalize_definition_options(
    tipo: str, options: list[str] | None
) -> list[str] | None:
    normalized = [option.strip() for option in (options or []) if option.strip()]
    if tipo == "select" and not normalized:
        raise CustomFieldValidationError("Campos select precisam de opções.")
    if tipo != "select" and normalized:
        raise CustomFieldValidationError("Somente campos select podem possuir opções.")
    if len(normalized) != len(set(normalized)):
        raise CustomFieldValidationError("As opções do campo devem ser únicas.")
    return normalized or None


def create_definition(
    db: Session,
    domain: CustomFieldDomain,
    payload: Any,
) -> dict[str, Any]:
    definition = domain.definition_model(
        nome=payload.nome,
        tipo=payload.tipo,
        opcoes=_normalize_definition_options(payload.tipo, payload.opcoes),
        obrigatorio=payload.obrigatorio,
        ativo=payload.ativo,
        ordem=payload.ordem,
    )
    db.add(definition)
    db.flush()
    return next(
        item for item in list_definitions(db, domain) if item["id"] == definition.id
    )


def update_definition(
    db: Session,
    domain: CustomFieldDomain,
    field_id: int,
    payload: Any,
) -> dict[str, Any]:
    definition = db.get(domain.definition_model, field_id)
    if definition is None:
        raise CustomFieldValidationError("Campo personalizado não encontrado.")
    updates = payload.model_dump(exclude_unset=True)
    next_type = updates.get("tipo", definition.tipo)
    next_options = updates.get("opcoes", _options(definition))
    if next_type != definition.tipo:
        has_values = db.scalar(
            select(domain.value_model.id).where(domain.value_model.campo_id == field_id)
        )
        if has_values is not None:
            raise CustomFieldValidationError(
                "Não é possível mudar o tipo de um campo que já possui valores."
            )
    updates["opcoes"] = _normalize_definition_options(next_type, next_options)
    for field_name, value in updates.items():
        setattr(definition, field_name, value)
    db.flush()
    return next(item for item in list_definitions(db, domain) if item["id"] == field_id)


def _normalize_value(definition: Any, value: Any) -> str | None:
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    field_type = definition.tipo
    if field_type == "text":
        if not isinstance(value, str):
            raise CustomFieldValidationError(f"{definition.nome} deve ser texto.")
        normalized = value.strip()
        if len(normalized) > 500:
            raise CustomFieldValidationError(
                f"{definition.nome} excede 500 caracteres."
            )
        return normalized
    if field_type == "integer":
        if isinstance(value, bool):
            raise CustomFieldValidationError(f"{definition.nome} deve ser inteiro.")
        try:
            normalized = int(value)
        except (TypeError, ValueError):
            raise CustomFieldValidationError(
                f"{definition.nome} deve ser inteiro."
            ) from None
        if str(normalized) != str(value).strip() and not isinstance(value, int):
            raise CustomFieldValidationError(f"{definition.nome} deve ser inteiro.")
        return str(normalized)
    if field_type == "decimal":
        try:
            normalized_decimal = Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise CustomFieldValidationError(
                f"{definition.nome} deve ser decimal."
            ) from None
        if not normalized_decimal.is_finite():
            raise CustomFieldValidationError(f"{definition.nome} deve ser decimal.")
        return format(normalized_decimal, "f")
    if field_type == "date":
        try:
            return date.fromisoformat(str(value)).isoformat()
        except ValueError:
            raise CustomFieldValidationError(
                f"{definition.nome} deve ser uma data válida."
            ) from None
    if field_type == "boolean":
        if not isinstance(value, bool):
            raise CustomFieldValidationError(f"{definition.nome} deve ser booleano.")
        return "true" if value else "false"
    if field_type == "select":
        if not isinstance(value, str) or value not in _options(definition):
            raise CustomFieldValidationError(
                f"{definition.nome} possui uma opção inválida."
            )
        return value
    raise CustomFieldValidationError("Tipo de campo personalizado inválido.")


def apply_values(
    db: Session,
    domain: CustomFieldDomain,
    entity_id: int,
    values: dict[str, Any],
) -> None:
    definitions = db.scalars(
        select(domain.definition_model).where(domain.definition_model.ativo.is_(True))
    ).all()
    by_name = {definition.nome: definition for definition in definitions}
    unknown = set(values) - set(by_name)
    if unknown:
        raise CustomFieldValidationError(
            f"Campos personalizados inválidos: {', '.join(sorted(unknown))}."
        )
    value_rows = db.scalars(
        select(domain.value_model).where(
            getattr(domain.value_model, domain.entity_id_name) == entity_id
        )
    ).all()
    by_field_id = {row.campo_id: row for row in value_rows}
    for definition in definitions:
        if (
            definition.obrigatorio
            and definition.id not in by_field_id
            and definition.nome not in values
        ):
            raise CustomFieldValidationError(
                f"O campo {definition.nome} é obrigatório."
            )
    for name, raw_value in values.items():
        definition = by_name[name]
        normalized = _normalize_value(definition, raw_value)
        current = by_field_id.get(definition.id)
        if normalized is None:
            if definition.obrigatorio:
                raise CustomFieldValidationError(
                    f"O campo {definition.nome} é obrigatório."
                )
            if current is not None:
                db.delete(current)
            continue
        if current is None:
            current = domain.value_model(
                campo_id=definition.id,
                **{domain.entity_id_name: entity_id},
            )
            db.add(current)
        current.valor = normalized


def read_values(
    db: Session,
    domain: CustomFieldDomain,
    entity_id: int,
) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(domain.value_model)
        .join(domain.value_model.campo)
        .where(getattr(domain.value_model, domain.entity_id_name) == entity_id)
        .order_by(domain.value_model.campo_id)
    ).all()
    definitions = {row.campo_id: row.campo for row in rows}
    result = []
    for row in rows:
        definition = definitions[row.campo_id]
        raw = row.valor
        if raw is not None and definition.tipo == "integer":
            value: Any = int(raw)
        elif raw is not None and definition.tipo == "decimal":
            value = float(raw)
        elif raw is not None and definition.tipo == "boolean":
            value = raw == "true"
        else:
            value = raw
        result.append(
            {
                "campo_id": definition.id,
                "nome": definition.nome,
                "tipo": definition.tipo,
                "opcoes": _options(definition),
                "obrigatorio": definition.obrigatorio,
                "ativo": definition.ativo,
                "ordem": definition.ordem,
                "valor": value,
            }
        )
    return result
