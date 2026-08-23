from pydantic import Field

from app.schemas.base import APIModel, ReadModel

COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"
RADIUS_PATTERN = r"^(0|[0-9]+(?:\.[0-9]+)?)(px|rem|em)$"


class AppearanceRead(ReadModel):
    id: int
    nome_sistema: str
    logo_url: str | None
    cor_primaria: str
    cor_secundaria: str
    cor_destaque: str
    cor_fundo: str
    cor_superficie: str
    cor_texto: str
    raio_controle: str
    raio_card: str
    rotulo_dashboard: str
    rotulo_clientes: str
    rotulo_produtos: str
    rotulo_funcionarios: str
    rotulo_fornecedores: str
    rotulo_vendas: str
    rotulo_nova_venda: str


class AppearancePatch(APIModel):
    nome_sistema: str | None = Field(default=None, min_length=1, max_length=120)
    cor_primaria: str | None = Field(default=None, pattern=COLOR_PATTERN)
    cor_secundaria: str | None = Field(default=None, pattern=COLOR_PATTERN)
    cor_destaque: str | None = Field(default=None, pattern=COLOR_PATTERN)
    cor_fundo: str | None = Field(default=None, pattern=COLOR_PATTERN)
    cor_superficie: str | None = Field(default=None, pattern=COLOR_PATTERN)
    cor_texto: str | None = Field(default=None, pattern=COLOR_PATTERN)
    raio_controle: str | None = Field(
        default=None,
        pattern=RADIUS_PATTERN,
        max_length=20,
    )
    raio_card: str | None = Field(default=None, pattern=RADIUS_PATTERN, max_length=20)
    rotulo_dashboard: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_clientes: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_produtos: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_funcionarios: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_fornecedores: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_vendas: str | None = Field(default=None, min_length=1, max_length=80)
    rotulo_nova_venda: str | None = Field(default=None, min_length=1, max_length=80)
