from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Funcionario, Venda
from app.schemas.employees import (
    FuncionarioCreate,
    FuncionarioRead,
    FuncionarioUpdate,
)

router = APIRouter(prefix="/api/employees", tags=["employees"])


def ensure_unique_cpf(
    db: Session,
    cpf: str,
    employee_id: int | None = None,
) -> None:
    query = select(Funcionario).where(Funcionario.cpf == cpf)
    if employee_id is not None:
        query = query.where(Funcionario.id != employee_id)
    if db.scalar(query) is not None:
        raise HTTPException(status_code=409, detail="CPF já cadastrado.")


@router.get("", response_model=list[FuncionarioRead])
def list_employees(
    active: bool | None = Query(default=None),
    db: Session = Depends(get_db_session),
) -> list[Funcionario]:
    query = select(Funcionario)
    if active is not None:
        query = query.where(Funcionario.ativo == active)
    return list(db.scalars(query.order_by(Funcionario.id)).all())


@router.get("/{employee_id}", response_model=FuncionarioRead)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db_session),
) -> Funcionario:
    employee = db.get(Funcionario, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
    return employee


@router.post("", response_model=FuncionarioRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: FuncionarioCreate,
    db: Session = Depends(get_db_session),
) -> Funcionario:
    ensure_unique_cpf(db, payload.cpf)
    employee = Funcionario(**payload.model_dump())
    db.add(employee)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CPF já cadastrado.") from None
    db.refresh(employee)
    return employee


@router.patch("/{employee_id}", response_model=FuncionarioRead)
def update_employee(
    employee_id: int,
    payload: FuncionarioUpdate,
    db: Session = Depends(get_db_session),
) -> Funcionario:
    employee = db.get(Funcionario, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

    updates = payload.model_dump(exclude_unset=True)
    if "cpf" in updates:
        ensure_unique_cpf(db, updates["cpf"], employee_id)
    for field_name, value in updates.items():
        setattr(employee, field_name, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CPF já cadastrado.") from None
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db_session),
) -> Response:
    employee = db.get(Funcionario, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
    if db.scalar(
        select(Venda.id).where(Venda.funcionario_id == employee_id)
    ) is not None:
        raise HTTPException(
            status_code=409,
            detail="Funcionário possui vendas relacionadas e não pode ser excluído.",
        )
    db.delete(employee)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Funcionário possui vendas relacionadas e não pode ser excluído.",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
