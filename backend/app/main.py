from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.customers import router as customers_router
from app.api.employees import router as employees_router
from app.api.health import router as health_router
from app.api.products import router as products_router
from app.api.sales import router as sales_router
from app.api.suppliers import router as suppliers_router
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    application = FastAPI(title="CRM Geral", version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://192.168.1.107:5174",
        ],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Accept", "Content-Type"],
    )
    register_exception_handlers(application)
    application.include_router(health_router)
    application.include_router(customers_router)
    application.include_router(suppliers_router)
    application.include_router(employees_router)
    application.include_router(products_router)
    application.include_router(sales_router)
    return application


app = create_app()
