# CRM Geral

CRM administrativo V1 para cadastros básicos e registro de vendas.

## Requisitos

- Python 3.11 ou superior;
- Node.js e npm;
- PostgreSQL;
- um banco de desenvolvimento e, preferencialmente, um banco separado para testes.

## Configuração

Copie `.env.example` para um arquivo `.env` dentro de `backend/` e ajuste as
URLs para as credenciais locais do PostgreSQL. Não versione o arquivo `.env`.

As variáveis principais são:

- `DATABASE_URL`: banco usado pelo backend e pelas migrations;
- `TEST_DATABASE_URL`: banco PostgreSQL dedicado aos testes.

Ambas devem usar o formato `postgresql+psycopg://...`.

## Migrations

No diretório `backend/`, execute:

```powershell
\.venv\Scripts\python.exe -m alembic upgrade head
```

## Execução local

Backend, em um terminal:

```powershell
cd backend
\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend, em outro terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

A aplicação fica disponível em `http://127.0.0.1:5173` e a documentação da
API em `http://127.0.0.1:8000/docs`.

## Testes e qualidade

Backend:

```powershell
cd backend
\.venv\Scripts\python.exe -m pytest
\.venv\Scripts\ruff.exe check app tests
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run typecheck
npm run build
```
