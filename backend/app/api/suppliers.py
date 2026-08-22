from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db_session
from app.models import Fornecedor, Produto, VendaItem
from app.schemas.suppliers import (
    FornecedorCreate,
    FornecedorDetailRead,
    FornecedorProdutoRead,
    FornecedorRead,
    FornecedorUpdate,
)

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
def list_suppliers(
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    state: str | None = Query(default=None),
    db: Session = Depends(get_db_session),
) -> list[Fornecedor]:
    query = select(Fornecedor)
    normalized_search = search.strip() if search else ""
    normalized_city = city.strip() if city else ""
    normalized_state = state.strip() if state else ""
    if normalized_search:
        pattern = f"%{normalized_search}%"
        query = query.where(
            or_(
                Fornecedor.nome.ilike(pattern),
                Fornecedor.cnpj.ilike(pattern),
                Fornecedor.cidade.ilike(pattern),
                Fornecedor.estado.ilike(pattern),
            )
        )
    if normalized_city:
        query = query.where(Fornecedor.cidade.ilike(normalized_city))
    if normalized_state:
        query = query.where(Fornecedor.estado.ilike(normalized_state))
    return list(db.scalars(query.order_by(Fornecedor.id)).all())


@router.get("/{supplier_id}", response_model=FornecedorDetailRead)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db_session),
) -> FornecedorDetailRead:
    supplier = db.scalar(
        select(Fornecedor)
        .options(selectinload(Fornecedor.produtos))
        .where(Fornecedor.id == supplier_id)
    )
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")

    supplier_read = FornecedorRead.model_validate(supplier)
    return FornecedorDetailRead(
        **supplier_read.model_dump(),
        produtos=[
            FornecedorProdutoRead.model_validate(product)
            for product in supplier.produtos
        ],
    )


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
    has_products = db.scalar(
        select(Produto.id).where(Produto.fornecedor_id == supplier_id)
    )
    if has_products is not None:
        raise HTTPException(
            status_code=409,
            detail="Fornecedor possui produtos relacionados e não pode ser excluído.",
        )
    has_historical_sales = db.scalar(
        select(VendaItem.id).where(VendaItem.fornecedor_id == supplier_id)
    )
    if has_historical_sales is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Fornecedor possui vendas históricas relacionadas e não pode "
                "ser excluído."
            ),
        )
    db.delete(supplier)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Fornecedor possui produtos ou vendas históricas relacionadas "
                "e não pode ser excluído."
            ),
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
