# AGENTS.md

## Objetivo

Este arquivo define como o Codex e seus subagentes devem trabalhar neste projeto.

Use o menor nível de capacidade suficiente para concluir a tarefa com segurança.
O objetivo não é maximizar o número de agentes, mas especializar quando houver
benefício real de qualidade, custo ou isolamento de contexto.

## Contexto obrigatório

- Leia `AI_CONTEXT.md` quando a tarefa depender da arquitetura ou estado do projeto.
- Investigue o código antes de propor mudanças.
- O código-fonte é a fonte final de verdade para detalhes de implementação.
- Se documentação e código divergirem, investigue e sinalize a divergência relevante.

## Papéis

- `fast`: mudanças pequenas e mecânicas.
- `implementer`: implementação normal.
- `economy_implementer`: implementação econômica e bem delimitada.
- `planner`: investigação e planejamento, sem editar.
- `reviewer`: revisão independente, sem editar.
- `architect`: decisões arquiteturais e problemas críticos, sem editar diretamente.

## Delegação

Sempre que delegar, registre no thread principal:

`[DELEGAÇÃO] agente=<nome> motivo=<justificativa curta>`

Quando o agente retornar:

`[RETORNO] agente=<nome> resultado=<resumo curto>`

Não exponha cadeia de raciocínio privada.

## Classificação

### FAST
Use `fast` para textos, labels, renames, CSS simples, boilerplate, lint,
tipagem isolada e testes triviais.

### NORMAL
O Codex principal pode executar diretamente.
Use `implementer` quando for útil isolar a execução.
Use `economy_implementer` quando a tarefa estiver bem delimitada e de baixo
risco arquitetural.

### COMPLEXA
Use `planner` primeiro quando a causa de um bug for desconhecida, houver
múltiplos módulos, dependências pouco claras ou uma feature precisar ser
decomposta.

Depois:
`planner -> implementer`
ou:
`planner -> economy_implementer`

### CRÍTICA / ARQUITETURAL
Use `architect` para:
- mudança de contrato público;
- migração ou persistência crítica;
- concorrência/race condition;
- refatoração estrutural;
- múltiplos subsistemas fortemente acoplados;
- trade-offs arquiteturais relevantes;
- incerteza persistente após investigação;
- duas tentativas razoáveis sem progresso.

## Matriz de fallback

`fast -> implementer`

`economy_implementer -> planner -> implementer`

Se estrutural:
`economy_implementer -> planner -> architect`

Primeira falha do implementer:
`implementer -> planner -> implementer`

Segunda falha razoável ou risco estrutural:
`implementer -> planner -> architect`

Planner sem diagnóstico seguro:
`planner -> architect`

Review com problema normal:
`reviewer -> implementer`

Review de implementação econômica, baixo risco:
`reviewer -> economy_implementer`

Review com problema estrutural:
`reviewer -> architect`

Se `architect` não fechar a decisão, não faça downgrade automático para agentes
menos capazes. Preserve evidências e deixe o escalonamento adicional manual.

## Tipos de falha

### Disponibilidade
Quota, timeout, provider ou autenticação pertencem ao 9Router/provider.
Não interprete isso como incapacidade do agente.

### Execução
Erro de sintaxe, teste, patch ou comando.
Se local, o mesmo agente corrige. Se revelar problema maior, use `planner`.

### Entendimento
Solução não atende ao pedido, ignora contrato ou perde contexto.
Use `planner -> agente apropriado`.

### Arquitetural
Mudança de contrato, redesign de persistência, race condition ou regressão
sistêmica. Use `architect`.

## Limite de tentativas

Não crie loops. Após duas tentativas razoáveis sem progresso:
1. pare;
2. use `planner` se ainda não foi usado;
3. reclassifique a tarefa;
4. use `architect` somente se os critérios forem atendidos.

## Implementação

- Preserve arquitetura e contratos.
- Faça a menor mudança correta.
- Não faça refatorações adjacentes sem necessidade.
- Não invente APIs, arquivos, tabelas, campos ou funções.
- Evite dependências novas sem necessidade.
- Atualize testes afetados.
- Confira `git diff` antes de finalizar.

## Revisão

Use `reviewer` especialmente para persistência, autenticação, contratos de API,
estado relevante, concorrência, refatorações e mudanças com risco de regressão.

Reviewer analisa; não reimplementa.

## Paralelismo

Prefira subagentes paralelos para:
- exploração;
- investigação;
- revisão;
- testes independentes;
- leitura de documentação.

Evite agentes paralelos editando os mesmos arquivos ou contratos.

## Verificação

Prefira:
1. testes focados;
2. typecheck;
3. lint;
4. build;
5. suíte completa quando o risco justificar.

## Git e ações externas

Não faça automaticamente:
- `git push`;
- merge;
- deploy;
- publicação;
- reset de banco;
- migração irreversível;
- commit, salvo pedido explícito.

## Codex vs 9Router

Codex decide o papel semântico.
9Router decide provider, quota, autenticação, disponibilidade e fallback técnico.

Não use fallback de provider que reduza drasticamente a capacidade de uma tarefa
crítica.

## Fluxos recomendados

Tarefa trivial:
`Codex -> fast -> validação`

Tarefa normal:
`Codex` ou `Codex -> implementer`

Tarefa econômica:
`Codex -> economy_implementer`

Bug desconhecido:
`Codex -> planner -> implementer`

Feature complexa:
`Codex -> planner -> implementer/economy_implementer -> reviewer`

Problema arquitetural:
`Codex -> planner (quando útil) -> architect -> implementer -> reviewer`

Falha repetida:
`implementer -> planner -> implementer -> architect`

## Regra final

Não troque de agente apenas para testar outro modelo.
Troque somente por escopo, especialização, investigação, revisão, falha real ou
risco arquitetural.
