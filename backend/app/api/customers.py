from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Cliente, Produto, Venda, VendaItem
from app.schemas.customers import (
    ClienteCreate,
    ClienteDetailRead,
    ClienteProdutoCompradoRead,
    ClienteRead,
    ClienteUpdate,
)

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[ClienteRead])
def list_customers(
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    state: str | None = Query(default=None),
    db: Session = Depends(get_db_session),
) -> list[Cliente]:
    query = select(Cliente)
    normalized_search = search.strip() if search else ""
    normalized_city = city.strip() if city else ""
    normalized_state = state.strip() if state else ""
    if normalized_search:
        pattern = f"%{normalized_search}%"
        query = query.where(
            or_(
                Cliente.nome.ilike(pattern),
                Cliente.cidade.ilike(pattern),
                Cliente.estado.ilike(pattern),
            )
        )
    if normalized_city:
        query = query.where(Cliente.cidade.ilike(normalized_city))
    if normalized_state:
        query = query.where(Cliente.estado.ilike(normalized_state))
    return list(db.scalars(query.order_by(Cliente.id)).all())


@router.get("/{customer_id}", response_model=ClienteDetailRead)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db_session),
) -> ClienteDetailRead:
    customer = db.get(Cliente, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    purchased_products_query = (
        select(
            Produto.id.label("produto_id"),
            Produto.nome,
            func.sum(VendaItem.quantidade).label("quantidade"),
        )
        .join(VendaItem, VendaItem.produto_id == Produto.id)
        .join(Venda, Venda.id == VendaItem.venda_id)
        .where(Venda.cliente_id == customer_id)
        .group_by(Produto.id, Produto.nome)
        .order_by(Produto.id)
    )
    purchased_products = [
        ClienteProdutoCompradoRead(
            produto_id=row.produto_id,
            nome=row.nome,
            quantidade=row.quantidade,
        )
        for row in db.execute(purchased_products_query)
    ]
    customer_read = ClienteRead.model_validate(customer)
    return ClienteDetailRead(
        **customer_read.model_dump(),
        produtos_comprados=purchased_products,
    )


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
