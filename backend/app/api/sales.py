from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Venda
from app.schemas.sales import VendaCreate, VendaRead
from app.services.sales import (
    SalePersistenceError,
    SaleReferenceNotFound,
    create_sale,
    get_sale,
    sale_query,
    sale_to_read,
)

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.post("", response_model=VendaRead, status_code=status.HTTP_201_CREATED)
def create_sale_endpoint(
    payload: VendaCreate,
    db: Session = Depends(get_db_session),
) -> VendaRead:
    try:
        sale = create_sale(db, payload)
    except SaleReferenceNotFound as exception:
        raise HTTPException(status_code=404, detail=str(exception)) from None
    except SalePersistenceError:
        raise HTTPException(
            status_code=409,
            detail="Não foi possível persistir a venda por conflito de integridade.",
        ) from None
    return sale_to_read(sale)


@router.get("", response_model=list[VendaRead])
def list_sales(db: Session = Depends(get_db_session)) -> list[VendaRead]:
    sales = db.scalars(
        sale_query().order_by(Venda.data_venda.desc(), Venda.id.desc())
    ).all()
    return [sale_to_read(sale) for sale in sales]


@router.get("/{sale_id}", response_model=VendaRead)
def get_sale_endpoint(
    sale_id: int,
    db: Session = Depends(get_db_session),
) -> VendaRead:
    sale = get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")
    return sale_to_read(sale)
