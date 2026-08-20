from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Fornecedor, Produto, VendaItem
from app.schemas.products import ProdutoCreate, ProdutoRead, ProdutoUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


def ensure_supplier_exists(db: Session, supplier_id: int) -> None:
    if db.get(Fornecedor, supplier_id) is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")


@router.get("", response_model=list[ProdutoRead])
def list_products(db: Session = Depends(get_db_session)) -> list[Produto]:
    return list(db.scalars(select(Produto).order_by(Produto.id)).all())


@router.get("/{product_id}", response_model=ProdutoRead)
def get_product(product_id: int, db: Session = Depends(get_db_session)) -> Produto:
    product = db.get(Produto, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    return product


@router.post("", response_model=ProdutoRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProdutoCreate,
    db: Session = Depends(get_db_session),
) -> Produto:
    ensure_supplier_exists(db, payload.fornecedor_id)
    product = Produto(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível criar o produto por conflito de integridade.",
        ) from None
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProdutoRead)
def update_product(
    product_id: int,
    payload: ProdutoUpdate,
    db: Session = Depends(get_db_session),
) -> Produto:
    product = db.get(Produto, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    updates = payload.model_dump(exclude_unset=True)
    if "fornecedor_id" in updates:
        ensure_supplier_exists(db, updates["fornecedor_id"])
    for field_name, value in updates.items():
        setattr(product, field_name, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível atualizar o produto por conflito de integridade.",
        ) from None
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db_session)) -> Response:
    product = db.get(Produto, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    if db.scalar(
        select(VendaItem.id).where(VendaItem.produto_id == product_id)
    ) is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Produto possui itens de venda relacionados e não pode ser excluído."
            ),
        )
    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Produto possui itens de venda relacionados e não pode ser excluído."
            ),
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
