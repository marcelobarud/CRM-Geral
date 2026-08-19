from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Fornecedor
from app.schemas.suppliers import FornecedorCreate, FornecedorRead, FornecedorUpdate

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


def ensure_unique_cnpj(
    db: Session,
    cnpj: str,
    supplier_id: int | None = None,
) -> None:
    query = select(Fornecedor).where(Fornecedor.cnpj == cnpj)
    if supplier_id is not None:
        query = query.where(Fornecedor.id != supplier_id)
    if db.scalar(query) is not None:
        raise HTTPException(status_code=409, detail="CNPJ já cadastrado.")


@router.get("", response_model=list[FornecedorRead])
def list_suppliers(db: Session = Depends(get_db_session)) -> list[Fornecedor]:
    return list(db.scalars(select(Fornecedor).order_by(Fornecedor.id)).all())


@router.get("/{supplier_id}", response_model=FornecedorRead)
def get_supplier(supplier_id: int, db: Session = Depends(get_db_session)) -> Fornecedor:
    supplier = db.get(Fornecedor, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    return supplier


@router.post("", response_model=FornecedorRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: FornecedorCreate,
    db: Session = Depends(get_db_session),
) -> Fornecedor:
    ensure_unique_cnpj(db, payload.cnpj)
    supplier = Fornecedor(**payload.model_dump())
    db.add(supplier)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CNPJ já cadastrado.") from None
    db.refresh(supplier)
    return supplier


@router.patch("/{supplier_id}", response_model=FornecedorRead)
def update_supplier(
    supplier_id: int,
    payload: FornecedorUpdate,
    db: Session = Depends(get_db_session),
) -> Fornecedor:
    supplier = db.get(Fornecedor, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")

    updates = payload.model_dump(exclude_unset=True)
    if "cnpj" in updates:
        ensure_unique_cnpj(db, updates["cnpj"], supplier_id)
    for field_name, value in updates.items():
        setattr(supplier, field_name, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CNPJ já cadastrado.") from None
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db_session),
) -> Response:
    supplier = db.get(Fornecedor, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    db.delete(supplier)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Fornecedor possui produtos relacionados e não pode ser excluído.",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
