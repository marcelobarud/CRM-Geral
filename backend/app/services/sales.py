from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models import Cliente, Funcionario, Produto, Venda, VendaItem
from app.schemas.sales import (
    ClienteResumo,
    FuncionarioResumo,
    ProdutoResumo,
    VendaCreate,
    VendaItemRead,
    VendaRead,
)

MONEY_QUANTUM = Decimal("0.01")


class SaleReferenceNotFound(Exception):
    """Indica uma referência de venda inexistente."""


class SalePersistenceError(Exception):
    """Indica falha controlada ao persistir uma venda."""


class SaleNotFound(Exception):
    """Indica uma venda inexistente durante uma operação de venda."""


def calculate_subtotal(quantity: Decimal, unit_price: Decimal) -> Decimal:
    return (quantity * unit_price).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )


def sale_query():
    return select(Venda).options(
        selectinload(Venda.cliente),
        selectinload(Venda.funcionario),
        selectinload(Venda.itens).selectinload(VendaItem.produto),
    )


def get_sale(db: Session, sale_id: int) -> Venda | None:
    return db.scalar(sale_query().where(Venda.id == sale_id))


def create_sale(db: Session, payload: VendaCreate) -> Venda:
    customer = db.get(Cliente, payload.cliente_id)
    if customer is None:
        raise SaleReferenceNotFound("Cliente não encontrado.")

    employee = db.get(Funcionario, payload.funcionario_id)
    if employee is None:
        raise SaleReferenceNotFound("Funcionário não encontrado.")

    product_ids = [item.produto_id for item in payload.itens]
    products = {
        product.id: product
        for product in db.scalars(
            select(Produto).where(Produto.id.in_(product_ids))
        ).all()
    }
    for product_id in product_ids:
        if product_id not in products:
            raise SaleReferenceNotFound("Produto não encontrado.")

    sale = Venda(
        cliente_id=customer.id,
        funcionario_id=employee.id,
        data_venda=payload.data_venda,
    )
    for item_payload in payload.itens:
        product = products[item_payload.produto_id]
        sale.itens.append(
            VendaItem(
                produto_id=product.id,
                quantidade=item_payload.quantidade,
                preco_unitario=product.preco_venda,
            )
        )

    db.add(sale)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise SalePersistenceError from None
    except Exception:
        db.rollback()
        raise

    persisted_sale = get_sale(db, sale.id)
    if persisted_sale is None:
        raise SalePersistenceError
    return persisted_sale


def delete_sale(db: Session, sale_id: int) -> None:
    sale = db.get(Venda, sale_id)
    if sale is None:
        raise SaleNotFound("Venda não encontrada.")

    try:
        db.execute(delete(VendaItem).where(VendaItem.venda_id == sale_id))
        db.delete(sale)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise SalePersistenceError from None
    except Exception:
        db.rollback()
        raise


def sale_to_read(sale: Venda) -> VendaRead:
    items: list[VendaItemRead] = []
    for item in sale.itens:
        items.append(
            VendaItemRead(
                id=item.id,
                produto=ProdutoResumo.model_validate(item.produto),
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
                subtotal=calculate_subtotal(
                    item.quantidade,
                    item.preco_unitario,
                ),
            )
        )

    total = sum((item.subtotal for item in items), Decimal("0.00"))
    return VendaRead(
        id=sale.id,
        data_venda=sale.data_venda,
        cliente=ClienteResumo.model_validate(sale.cliente),
        funcionario=FuncionarioResumo.model_validate(sale.funcionario),
        itens=items,
        total=total,
    )
