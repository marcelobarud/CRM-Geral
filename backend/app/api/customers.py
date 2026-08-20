from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Cliente, Venda
from app.schemas.customers import ClienteCreate, ClienteRead, ClienteUpdate

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[ClienteRead])
def list_customers(db: Session = Depends(get_db_session)) -> list[Cliente]:
    return list(db.scalars(select(Cliente).order_by(Cliente.id)).all())


@router.get("/{customer_id}", response_model=ClienteRead)
def get_customer(customer_id: int, db: Session = Depends(get_db_session)) -> Cliente:
    customer = db.get(Cliente, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return customer


@router.post("", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: ClienteCreate,
    db: Session = Depends(get_db_session),
) -> Cliente:
    customer = Cliente(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.patch("/{customer_id}", response_model=ClienteRead)
def update_customer(
    customer_id: int,
    payload: ClienteUpdate,
    db: Session = Depends(get_db_session),
) -> Cliente:
    customer = db.get(Cliente, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field_name, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db_session),
) -> Response:
    customer = db.get(Cliente, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    if db.scalar(
        select(Venda.id).where(Venda.cliente_id == customer_id)
    ) is not None:
        raise HTTPException(
            status_code=409,
            detail="Cliente possui vendas relacionadas e não pode ser excluído.",
        )
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cliente possui vendas relacionadas e não pode ser excluído.",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
