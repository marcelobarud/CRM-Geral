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

Estado atual: a V1 foi implementada e validada nas Fases 1 a 10, e a Fase 11
foi concluída. A implementação da Fase 12 adicionou o status operacional de
funcionários, o filtro de funcionários ativos em Nova Venda e a proteção
backend contra vendas iniciadas por funcionários inativos. A migration da
Fase 12 utiliza `revision = "20260820_0001"`, com `down_revision =
"20260818_0001"`, respeitando o limite padrão de 32 caracteres da tabela
`alembic_version`. A Fase 13 foi concluída com o snapshot histórico do
fornecedor em `VendaItem`, incluindo migration, model, serviço, contratos e
testes. A Fase 14 foi implementada para melhorar a listagem e o detalhamento
de Vendas: a listagem prioriza Produto, Valor Total, Cliente e Funcionário;
vendas com múltiplos itens exibem a contagem de produtos; e o detalhe
apresenta preço, subtotal e fornecedor histórico. A validação PostgreSQL da
Fase 14 foi confirmada pelo usuário com `63 passed`. A Fase 15 foi implementada
parcialmente no código, com validação local concluída; a validação PostgreSQL
real e a revisão manual responsiva ainda dependem do ambiente externo. A Fase
16 foi concluída com infraestrutura implementada e um piloto na tela de
Funcionários, incluindo busca textual no backend, filtro de ativos, combinação
AND, limpar filtros e estados de loading, erro e zero resultados. A validação
PostgreSQL real da Fase 16 foi confirmada pelo usuário. A Fase 17 não foi
iniciada.

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
- Status operacional (`ativo`), com padrão `true` para novos registros e
  registros existentes após a migration da Fase 12.

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
- ID do fornecedor no momento da venda (`fornecedor_id`)

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
    venda_itens.fornecedor_id → fornecedores.id
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
- `venda_itens.fornecedor_id` deve preservar o fornecedor associado ao Produto
  no momento da venda e não pode ser nulo.
- Alterações posteriores em `produtos.fornecedor_id` não podem modificar o
  snapshot histórico já persistido em `venda_itens`.
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

### Fornecedor histórico do item

Decisão: `venda_itens.fornecedor_id` armazena o fornecedor associado ao Produto
no momento da criação da venda, com `NOT NULL` e foreign key para
`fornecedores.id`.

Motivo: preservar a referência histórica mesmo que o fornecedor atual do
Produto seja alterado posteriormente.

Consequência: o frontend não informa o fornecedor histórico; o backend captura
`Produto.fornecedor_id` de um Produto persistido. A migration da Fase 13 faz
backfill dos itens existentes usando o fornecedor atual do Produto no momento
da migration, que é a única informação disponível para registros anteriores.

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
itens órfãos não são permitidos. Soft delete, arquivamento e auditoria de
exclusões ficam fora da V1. O campo `ativo` foi introduzido posteriormente
na Fase 12 do `IMPLEMENTATION_PLAN_02.md` como status operacional de
Funcionários; ele não representa soft delete.

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

### Status operacional de Funcionários

Decisão: Funcionários possuem `ativo`, um booleano não nulo com padrão `true`.

Motivo: permitir retirar um funcionário da operação de novas vendas sem
remover seu cadastro ou quebrar o histórico já registrado.

Consequências:

- novos funcionários nascem ativos;
- funcionários existentes permanecem ativos após a migration;
- `GET /api/employees` sem filtro continua incluindo ativos e inativos;
- `GET /api/employees?active=true` é o filtro mínimo usado por Nova Venda;
- o backend rejeita novas vendas com funcionário inativo;
- vendas históricas continuam exibindo o funcionário inativo;
- a proteção de exclusão de funcionário referenciado permanece inalterada;
- o PATCH existente permite ativar e inativar o funcionário.

### Listagem e detalhamento de Vendas

Decisão: a leitura operacional de Vendas prioriza Produto, Valor Total,
Cliente e Funcionário, nessa ordem.

Consequências:

- uma Venda com um único item exibe o nome do Produto;
- uma Venda com dois ou mais Produtos exibe `<n> produtos`, contando IDs de
  Produtos distintos;
- o total continua derivado dos `VendaItens` e de seus preços históricos;
- o detalhamento exibe quantidade, preço unitário histórico, subtotal e o
  fornecedor histórico de `VendaItem`;
- a leitura do fornecedor histórico utiliza `venda_itens.fornecedor_id`, sem
  reconstruí-lo a partir do fornecedor atual do Produto;
- o backend carrega Produto e Fornecedor histórico com eager loading para
  evitar consultas individuais por item;
- filtros e detalhes relacionais de Cliente ou Fornecedor permanecem fora da
  Fase 14.

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
- [x] Fase 11: correções de UI e consistência visual.
- [x] Implementação da Fase 12: status de Funcionários, filtro em Nova Venda,
  bloqueio backend e testes associados.
- [x] Validação PostgreSQL final da Fase 12 após a correção do identificador
  da migration.
- [x] Fase 13 concluída: snapshot histórico de fornecedor em `VendaItem`,
  integridade referencial, serviço e testes.
- [x] Fase 14 concluída: listagem e detalhamento de Vendas com valores
  históricos, fornecedor histórico e validação PostgreSQL (`63 passed`).
- [x] Fase 16 concluída: infraestrutura de filtros, piloto de Funcionários e
  validação PostgreSQL real confirmada pelo usuário.
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

Data: 2026-08-21

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
- Fase 11 concluída com correções de overflow/alinhamento dos itens de Nova
  Venda e hierarquia visual do Dashboard.
- Fase 12 implementada com `funcionarios.ativo`, migration reversível,
  `GET /api/employees?active=true`, PATCH de status, bloqueio de vendas por
  funcionário inativo e indicação visual no frontend.
- O identificador inicial da migration excedia `VARCHAR(32)` em
  `alembic_version`; foi corrigido para `20260820_0001` sem criar migration
  adicional. A validação PostgreSQL pós-correção foi executada e confirmada
  pelo usuário.
- Fase 13 concluída com `venda_itens.fornecedor_id` obrigatório, FK para
  `fornecedores.id`, backfill da migration `20260820_0002`, captura do snapshot
  pelo serviço de vendas e proteção de fornecedor historicamente referenciado.
- Fase 14 implementada com resumo do fornecedor histórico no contrato de
  leitura, eager loading sem N+1, listagem na ordem Produto/Valor Total/
  Cliente/Funcionário, contagem de múltiplos produtos e detalhe completo dos
  itens.
- A validação local da Fase 14 ficou em `27 passed, 36 skipped, 1 warning` no
  backend e `34 passed` no frontend; os skips ocorreram porque
  `TEST_DATABASE_URL` não estava definida. Ruff, lint, typecheck e build
  passaram.
- A validação manual confirmou desktop, notebook e mobile próximo de
  `390 × 844`, sem overflow horizontal; o detalhe foi verificado com 1 e 3
  itens e a listagem com 1, 2 e 3 produtos.
- A validação PostgreSQL da Fase 14 foi confirmada pelo usuário com `63 passed`.
- A Fase 15 adicionou detalhes relacionais sem persistência duplicada: o detalhe
  de Fornecedor deriva Produtos por `Produto.fornecedor_id`, e o detalhe de
  Cliente deriva Produtos comprados por `Cliente → Vendas → VendaItens → Produto`.
- Produtos comprados são consolidados por `produto_id` em query agregada, com
  soma Decimal de `VendaItem.quantidade`; Produtos com o mesmo nome e IDs
  diferentes permanecem registros distintos.
- O detalhe de Fornecedor usa `selectinload(Fornecedor.produtos)` para evitar
  N+1; o detalhe de Cliente usa uma query `GROUP BY`/`SUM`, sem cascata N+1.
- A implementação local da Fase 15 passou Ruff, backend `27 passed, 38 skipped,
  1 warning`, frontend lint, typecheck, `38 passed` e build. Os skips ocorreram
  porque `TEST_DATABASE_URL` não estava definida neste processo; a validação
  manual responsiva também permanece pendente.
- A Fase 15 ainda não está formalmente concluída até a validação PostgreSQL real
  e a revisão manual.
- A Fase 16 foi implementada como infraestrutura mínima e reutilizável: o
  `SearchInput` é compartilhado, enquanto o piloto de Funcionários mantém
  estado de edição e estado aplicado para busca e `ativo`, com aplicação
  explícita e limpeza dos filtros.
- O endpoint `GET /api/employees` aceita `search` e `active`; `search` é
  normalizado por trim e aplicado apenas aos campos visíveis da listagem
  (`nome_completo`, `cpf`, `cidade` e `estado`). Os parâmetros são combinados
  com AND e enviados por query string HTTP, sem introduzir estado na URL da
  aplicação.
- A Fase 16 não adicionou filtros relacionais invisíveis, engine universal,
  migration ou funcionalidade de módulos posteriores. A validação local passou
  com Ruff, backend `27 passed, 39 skipped, 1 warning`, frontend lint,
  typecheck, `44 passed` e build; os skips ocorreram porque
  `TEST_DATABASE_URL` não estava definida neste processo. A revisão manual
  confirmou busca, combinação com ativos, limpeza, zero resultados e o layout
  em 1440×900, 1024×768 e 390×844. A validação PostgreSQL real foi concluída
  e confirmada pelo usuário.
