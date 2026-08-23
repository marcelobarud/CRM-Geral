import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.appearance import AppearanceSettings
from app.schemas.appearance import AppearancePatch, AppearanceRead

router = APIRouter(prefix="/api/settings/appearance", tags=["appearance"])
LOGO_STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage" / "branding"
MAX_LOGO_BYTES = 2 * 1024 * 1024

DEFAULTS = {
    "id": 1,
    "nome_sistema": "CRM Geral",
    "logo_url": None,
    "cor_primaria": "#487A98",
    "cor_secundaria": "#2F5975",
    "cor_destaque": "#2F8065",
    "cor_fundo": "#EEF4F8",
    "cor_superficie": "#FFFFFF",
    "cor_texto": "#1E293B",
    "raio_controle": "0.75rem",
    "raio_card": "1.5rem",
    "rotulo_dashboard": "Dashboard",
    "rotulo_clientes": "Clientes",
    "rotulo_produtos": "Produtos",
    "rotulo_funcionarios": "Funcionários",
    "rotulo_fornecedores": "Fornecedores",
    "rotulo_vendas": "Vendas",
    "rotulo_nova_venda": "Nova venda",
}


def appearance_or_default(db: Session) -> AppearanceSettings:
    settings = db.get(AppearanceSettings, 1)
    if settings is None:
        settings = AppearanceSettings(**DEFAULTS)
        db.add(settings)
        db.flush()
    return settings


def remove_logo_file(logo_url: str | None) -> None:
    if not logo_url or not logo_url.startswith("/uploads/branding/"):
        return
    filename = Path(logo_url).name
    if filename:
        (LOGO_STORAGE_DIR / filename).unlink(missing_ok=True)


@router.get("", response_model=AppearanceRead)
def get_appearance(db: Session = Depends(get_db_session)) -> AppearanceSettings:
    settings = appearance_or_default(db)
    db.commit()
    db.refresh(settings)
    return settings


@router.patch("", response_model=AppearanceRead)
def update_appearance(
    payload: AppearancePatch,
    db: Session = Depends(get_db_session),
) -> AppearanceSettings:
    settings = appearance_or_default(db)
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field_name, value)
    try:
        db.commit()
        db.refresh(settings)
    except Exception:
        db.rollback()
        raise
    return settings


@router.post("/reset", response_model=AppearanceRead)
def reset_appearance(db: Session = Depends(get_db_session)) -> AppearanceSettings:
    settings = appearance_or_default(db)
    previous_logo = settings.logo_url
    for field_name, value in DEFAULTS.items():
        if field_name != "id":
            setattr(settings, field_name, value)
    try:
        db.commit()
        db.refresh(settings)
    except Exception:
        db.rollback()
        raise
    remove_logo_file(previous_logo)
    return settings


@router.put("/logo", response_model=AppearanceRead)
async def upload_logo(
    request: Request,
    db: Session = Depends(get_db_session),
) -> AppearanceSettings:
    content_type = request.headers.get("content-type", "").split(";", 1)[0].lower()
    extensions = {
        "image/png": ("png", b"\x89PNG\r\n\x1a\n"),
        "image/jpeg": ("jpg", b"\xff\xd8\xff"),
        "image/webp": ("webp", b"RIFF"),
    }
    if content_type not in extensions:
        raise HTTPException(
            status_code=415,
            detail="Envie uma imagem PNG, JPEG ou WEBP.",
        )
    body = await request.body()
    if len(body) > MAX_LOGO_BYTES:
        raise HTTPException(status_code=413, detail="A logo deve ter no máximo 2 MB.")
    extension, signature = extensions[content_type]
    if not body.startswith(signature) or (
        content_type == "image/webp" and b"WEBP" not in body[:16]
    ):
        raise HTTPException(
            status_code=415,
            detail="O conteúdo enviado não corresponde ao tipo da imagem.",
        )

    LOGO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    destination = LOGO_STORAGE_DIR / filename
    destination.write_bytes(body)
    settings = appearance_or_default(db)
    previous_logo = settings.logo_url
    settings.logo_url = f"/uploads/branding/{filename}"
    try:
        db.commit()
        db.refresh(settings)
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    remove_logo_file(previous_logo)
    return settings
