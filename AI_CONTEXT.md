# AI_CONTEXT.md

Este arquivo é a referência do contexto atual do CRM Geral. Ele documenta o
produto, o escopo da V1 e as decisões arquiteturais que devem orientar agentes
e implementações futuras.

AGENTS.md continua sendo a fonte das regras de trabalho do repositório.

## 1. Visão geral

Produto: CRM genérico e adaptável, inicialmente voltado a lojas em geral.

Objetivo da V1: oferecer um sistema administrativo simples para cadastro de
entidades básicas e registro de vendas. A arquitetura deve permitir evolução,
mas a V1 não deve implementar antecipadamente funcionalidades de versões
futuras.

Estado atual: a V1 foi implementada e validada nas Fases 1 a 10. O backend
FastAPI, o frontend React/Vite, o modelo PostgreSQL, as migrations, os CRUDs,
vendas, dashboard e testes estão presentes no repositório. A validação
PostgreSQL final foi executada em banco dedicado após a correção do rollback
de exclusão de venda, com duas execuções consecutivas e `57 passed` em cada.

Princípio central: privilegiar simplicidade sobre abrangência. Não tratar
CRM genérico como autorização para construir uma plataforma completa.

## 2. Stack definida

### Frontend

- React
- TypeScript
- Vite
- Interface web administrativa responsiva

### Backend

- Python
- FastAPI
- Pydantic para validação de dados e contratos da API

### Persistência

- PostgreSQL
- SQLAlchemy como ORM
- Alembic para migrations

### Versionamento

- Git
- GitHub

## 3. Organização preferencial

O projeto deve seguir uma organização monorepo:

    crm-geral/
    ├── frontend/
    ├── backend/
    ├── AGENTS.md
    ├── AI_CONTEXT.md
    ├── .env.example
    ├── .gitignore
    └── README.md

A estrutura interna deve permanecer modular e fácil de alterar. Conforme o
projeto crescer, o frontend pode ser organizado por funcionalidade, por
exemplo customers/, suppliers/, employees/, products/ e sales/.

## 4. Arquitetura

Fluxo principal:

    React + TypeScript
            ↓ HTTP/JSON
    FastAPI + Pydantic
            ↓ regras de negócio e acesso aos dados
    SQLAlchemy
            ↓
    PostgreSQL

Regras de organização:

- O frontend nunca acessa o PostgreSQL diretamente.
- Toda regra de negócio, validação persistente e acesso aos dados passa pelo
  backend.
- APIs devem ser explícitas, previsíveis e orientadas às entidades da V1.
- Evitar criar uma abstração genérica de CRUD antes de existir uma necessidade
  concreta.
- Alterações de schema devem ser feitas por migrations Alembic, nunca por
  alterações manuais não versionadas no banco.
- A separação entre cadastro mestre e transações deve ser preservada.

## 5. Modelo de domínio da V1

Os nomes abaixo representam o modelo conceitual. A implementação deverá
definir tipos, nulabilidade, índices e nomes físicos das colunas de forma
consistente com este contexto. IDs são gerados pelo sistema e não são
informados manualmente pelo usuário.

### Clientes

Campos obrigatórios:

- ID
- Nome
- Cidade
- Estado
- Rua
- Número

Campo opcional:

- Complemento

### Fornecedores

Campos obrigatórios:

- ID
- Nome
- Cidade
- Estado
- Rua
- Número
- CNPJ

Campo opcional:

- Complemento

### Funcionários

Campos obrigatórios:

- ID
- Nome completo
- Cidade
- Estado
- Rua
- Número
- CPF
- Data de nascimento

Campos opcionais:

- Complemento
- RG

### Produtos

Campos obrigatórios:

- ID
- Nome do produto
- Categoria
- Preço de custo
- Preço de venda
- ID do fornecedor

### Vendas

Campos obrigatórios:

- ID
- ID do cliente
- ID do funcionário
- Data da venda

Exclusão explícita de uma venda remove a própria venda e todos os seus itens
da venda. Essa operação não remove os cadastros raiz referenciados: cliente,
funcionário, produto e fornecedor permanecem existentes.

### Itens da venda

Campos obrigatórios:

- ID
- ID da venda
- ID do produto
- Quantidade
- Preço unitário

VendaItem não possui exclusão independente pela interface e não deve existir
sem uma Venda. `venda_id` permanece obrigatório; não utilizar `SET NULL` nem
criar itens órfãos.

Uma venda deve ser separada de seus itens. Assim, uma venda pode conter
múltiplos produtos sem repetir ou conflitar o ID da venda.

Relacionamentos mínimos:

    vendas.cliente_id      → clientes.id
    vendas.funcionario_id  → funcionarios.id
    venda_itens.venda_id   → vendas.id
    venda_itens.produto_id → produtos.id
    produtos.fornecedor_id → fornecedores.id

O nome do produto não deve ser armazenado como informação redundante em
venda_itens; deve ser obtido pela relação com produtos. O preço aplicado na
venda deve ser preservado em venda_itens.preco_unitario, sem depender do preço
atual cadastrado em produtos. Snapshot histórico do nome do produto fica fora
da V1.

## 6. Interface administrativa

A aplicação deve possuir uma interface web administrativa com as seguintes
áreas:

- Dashboard simples
- Clientes
- Produtos
- Fornecedores
- Funcionários
- Nova venda
- Lista de vendas

Para os cadastros, considerar inicialmente as operações:

- listar;
- criar;
- visualizar;
- editar;
- excluir.

O design deve ser:

- genérico e adaptável a lojas em geral;
- clean e acolhedor;
- baseado em cores frias;
- composto por cards e componentes com formas arredondadas;
- responsivo;
- visualmente consistente.

## 7. Regras de domínio e dados

- IDs principais devem ser únicos e gerados pelo sistema.
- Campos obrigatórios devem possuir constraints de nulabilidade coerentes no
  banco e não aceitar NULL.
- Campos opcionais devem aceitar NULL quando a ausência da informação for
  apropriada.
- Não criar valores padrão artificiais apenas para evitar NULL.
- Não substituir ausência de informação por strings vazias sem necessidade.
- Complemento permanece opcional em clientes, fornecedores e funcionários.
- RG permanece opcional em funcionários e não é obrigatório na V1.
- Relacionamentos devem utilizar foreign keys com constraints explícitas no
  PostgreSQL.
- Utilizar outras constraints e índices do PostgreSQL quando aplicável.
- CNPJ de fornecedores deve possuir restrição de unicidade.
- CPF de funcionários deve possuir restrição de unicidade.
- CPF e CNPJ devem ser tratados como strings, nunca como números.
- RG deve ser tratado como string.
- Estado deve ser armazenado como texto curto.
- Número do endereço deve utilizar representação que permita valores como 10A,
  S/N ou equivalentes no futuro.
- quantidade deve ser maior que zero e pode admitir valores fracionários,
  persistidos com representação decimal adequada; unidade de medida permanece
  fora da V1.
- preco_custo, preco_venda e preco_unitario não podem ser negativos.
- Valores monetários devem utilizar tipo decimal apropriado, nunca ponto
  flutuante binário.
- data_nascimento deve utilizar tipo de data apropriado.
- data_venda deve utilizar tipo apropriado para data e hora da operação.
- No fluxo de inclusão de um item, o backend deve consultar o preco_venda
  atual do produto e persistir esse valor como preco_unitario.
- O total de cada item deve ser derivado de quantidade multiplicada por
  preco_unitario.
- O total da venda deve ser derivado da soma dos itens.
- Não persistir valor_total na venda nem nos itens na V1.
- Não permitir que o histórico de preço de uma venda dependa do preço atual do
  produto.
- A validação de CPF, RG e CNPJ permanece limitada a tipos, unicidade e regras
  básicas; não adicionar bibliotecas externas de validação documental na V1.
- Campos, tabelas e relacionamentos devem ser adicionados ou alterados por
  migrations.

## 8. Segurança

Segurança deve ser considerada desde o início:

- Nunca versionar secrets.
- Manter arquivos .env fora do Git.
- Fornecer .env.example sem valores secretos.
- Não armazenar senhas em texto puro caso autenticação seja adicionada.
- Validar entradas no backend.
- Utilizar SQLAlchemy e queries parametrizadas.
- Aplicar o princípio de menor privilégio.
- Tratar CPF, RG e CNPJ como dados sensíveis e evitar exposição desnecessária.
- Não registrar informações sensíveis em logs sem necessidade.
- Manter .gitignore adequado.
- Não adicionar credenciais, chaves, certificados ou dumps de banco ao
  repositório.

## 9. Fora do escopo da V1

Não implementar sem solicitação explícita:

- estoque;
- pagamentos;
- caixa;
- categorias cadastráveis;
- serviços;
- agenda;
- ordens de serviço;
- comissões;
- dashboards analíticos avançados;
- relatórios avançados;
- importação ou exportação;
- campos personalizados;
- schema configurável pela interface;
- integrações externas;
- telefone e e-mail adicionais;
- CEP;
- cargos;
- data de admissão;
- múltiplos fornecedores por produto.

A arquitetura pode permitir essas evoluções posteriormente, mas não deve
carregar agora a complexidade necessária para implementá-las.

## 10. Decisões arquiteturais

### V1 pequena sobre uma fundação evolutiva

Decisão: manter o escopo operacional reduzido, usando PostgreSQL, foreign
keys, constraints, migrations, validação no backend e módulos separados.

Motivo: permitir evolução estrutural sem transformar a V1 em uma plataforma
complexa ou em um banco completamente dinâmico.

Consequência: novas colunas e tabelas devem ser introduzidas de forma
explícita, com alteração coordenada de migration, modelo, schema, API e
interface quando necessário.

### Venda e itens de venda separados

Decisão: uma venda possui seus próprios dados e uma coleção de itens.

Motivo: uma única venda pode conter vários produtos.

Consequência: o produto é relacionado por produto_id; não duplicar o nome do
produto em cada item.

### Categoria como texto simples

Decisão: categoria permanece como campo de texto em produtos na V1.

Motivo: manter o cadastro simples sem introduzir uma entidade de categorias ou
um fluxo de categorias cadastráveis.

Consequência: categorias normalizadas ou administráveis ficam fora da V1.

### Funcionário responsável pela venda

Decisão: vendas possui funcionario_id, referenciando funcionarios.id.

Motivo: registrar qual funcionário realizou a venda sem introduzir comissões,
cargos ou regras adicionais.

### Preço histórico do item

Decisão: venda_itens.preco_unitario armazena o preço de venda efetivamente
aplicado no momento da inclusão do item.

Motivo: preservar o histórico de preço mesmo quando produtos.preco_venda for
alterado posteriormente.

Consequência: o backend deve buscar o preço atual do produto no momento da
operação e persistir uma cópia no item. O nome do produto continua sendo lido
pela relação com produtos; snapshots de nome ou outros atributos ficam para
versões futuras.

### Totais derivados

Decisão: não persistir valor_total em vendas nem em venda_itens na V1.

Motivo: evitar dados redundantes enquanto não existir necessidade concreta de
persistência adicional.

Consequência: o total do item é quantidade multiplicada por preco_unitario e o
total da venda é a soma dos totais derivados de seus itens.

### Exclusão física com integridade referencial

Decisão: exclusões podem ser físicas na V1, desde que não removam
silenciosamente dados relacionados. Cadastros raiz referenciados permanecem
protegidos contra exclusão quando possuem dependências.

Motivo: manter a V1 simples e preservar a integridade e o histórico das
vendas.

Consequência: quando um registro estiver referenciado e sua remoção
comprometer a integridade ou o histórico, o backend deve impedir a exclusão e
retornar uma resposta clara para a interface. A Venda pode ser excluída
explicitamente pelo usuário; nessa operação, o backend exclui primeiro e na
mesma transação exclusivamente os VendaItens daquela venda e depois a Venda.
Não utilizar cascatas destrutivas a partir de Cliente, Funcionário, Produto ou
Fornecedor. VendaItem continua com `venda_id` obrigatório, sem `SET NULL`, e
itens órfãos não são permitidos. Soft delete, campo ativo, arquivamento e
auditoria de exclusões ficam fora da V1.

### Tipos e regras mínimas de dados

Decisão: IDs são gerados pelo sistema; documentos são strings; valores
monetários utilizam decimal; datas utilizam tipos próprios; e foreign keys
possuem constraints explícitas no PostgreSQL.

Motivo: garantir consistência de persistência sem adicionar validações
específicas ou regras de negócio desnecessárias.

### Backend como fronteira de dados

Decisão: toda comunicação com o banco e toda regra de negócio passa pelo
FastAPI.

Motivo: centralizar segurança, validação, consistência e regras de domínio.

Consequência: o React consome contratos HTTP/JSON e não conhece as credenciais
ou a conexão do PostgreSQL.

## 11. Pontos ainda não especificados

As ambiguidades arquiteturais relevantes da V1 estão resolvidas neste
documento. A obrigatoriedade, a opcionalidade e a nulabilidade dos campos
foram formalizadas no modelo de domínio e nas regras de dados.

Detalhes de implementação, como comprimentos exatos de strings e formatos de
contratos da API, podem ser definidos durante a implementação sem alterar as
decisões arquiteturais registradas aqui.

## 12. Estado de implementação e backlog orientativo

- [x] Bootstrap do monorepo, frontend e backend executáveis.
- [x] Contratos iniciais da API, migrations e modelos da V1.
- [x] Validações, endpoints, testes principais, telas administrativas,
  vendas e dashboard simples.
- [x] Reexecutar duas vezes a suíte PostgreSQL após a correção do rollback de
  exclusão de venda.
- [ ] Funcionalidades fora da V1 permanecem no backlog futuro.

## 13. Comandos

Os comandos principais estão documentados em `README.md`. No backend, use os
executáveis da `.venv` sem ativar a virtualenv:

```powershell
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m pytest -q
```

Os testes PostgreSQL exigem `TEST_DATABASE_URL` fornecida externamente e
apontando para um banco dedicado com sufixo `_test`.

## 14. Última atualização

Data: 2026-08-19

- Ambiguidades do modelo resolvidas: categoria, funcionário responsável,
  histórico de preço, totais, exclusões e tipos mínimos de dados.
- Regra de exclusão de vendas formalizada: excluir uma Venda remove somente a
  Venda e seus VendaItens; Cliente, Funcionário, Produto e Fornecedor
  permanecem preservados.
- Obrigatoriedade, opcionalidade e nulabilidade dos campos da V1 formalizadas;
  RG permanece opcional.
- Modelo de Vendas, relacionamentos e regras de domínio atualizados para
  refletir as decisões aprovadas.
- Fases 1 a 10 implementadas e validadas; a suíte PostgreSQL passou duas vezes
  consecutivas com `57 passed` em cada execução.
