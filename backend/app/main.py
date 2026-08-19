from fastapi import FastAPI

from app.api.customers import router as customers_router
from app.api.employees import router as employees_router
from app.api.health import router as health_router
from app.api.products import router as products_router
from app.api.suppliers import router as suppliers_router
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    application = FastAPI(title="CRM Geral", version="0.1.0")
    register_exception_handlers(application)
    application.include_router(health_router)
    application.include_router(customers_router)
    application.include_router(suppliers_router)
    application.include_router(employees_router)
    application.include_router(products_router)
    return application


app = create_app()
