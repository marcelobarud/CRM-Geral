from app.main import app


def test_fastapi_app_can_be_imported() -> None:
    assert app.title == "CRM Geral"
