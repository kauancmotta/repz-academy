# Como dar contexto à IA (nova sessão)

Este guia permite abrir uma **conversa nova** com o Claude (ou outra IA) e fazê-la entender o projeto Repz **somente a partir dos arquivos do repositório**. Não é preciso compartilhar conversas anteriores.

A regra do SDD vale aqui: **a spec é o contexto**. Se algo mudar, atualize o arquivo em `docs/` e anexe a versão nova.

## 1. Atualize o repositório

```bash
git pull origin main
```

## 2. Anexe os arquivos na conversa

**Sempre (base):**

- `docs/specs/constitution.md`
- `docs/arquitetura.md`
- `docs/plano-do-projeto.md`
- `DOCUMENTACAO_IA.md`
- O PDF "Diretrizes do Trabalho de Laboratório II" (regras e critérios de avaliação do professor)

**Por funcionalidade** (somente a que será feita agora, por exemplo `001-autenticacao`):

- `docs/specs/NNN-nome/spec.md`
- `docs/specs/NNN-nome/plan.md`
- `docs/specs/NNN-nome/tasks.md`

> Anexe uma funcionalidade por vez. Isso mantém a IA focada e evita código fora do escopo.
>
> **Use a mesma conversa durante o projeto todo.** O anexo da base (lista "Sempre") e o prompt inicial são enviados só uma vez, no começo. A cada funcionalidade nova, anexe os três arquivos dela e envie a mensagem curta da seção 3.

## 3. Cole o prompt inicial

Troque o que está entre `[colchetes]` e apague a parte que não se aplica (frontend ou backend).

```text
Você vai me ajudar a construir o projeto "Repz", um trabalho acadêmico de Ciência da Computação, feito em dupla. Siga estritamente o Spec-Driven Development (SDD): os arquivos anexados são a fonte da verdade.

CONTEXTO
- Repz é um app de academia: o personal monta o treino do aluno por dia da semana, o aluno executa série a série (carga em kg e repetições) e o sistema mostra a evolução. Aluno sem personal monta o próprio treino.
- Repositório único (monorepo): backend/, frontend/ e docs/.
- A dupla é Kauan (backend) e Gustavo (frontend). Eu sou [Kauan | Gustavo] e vou trabalhar na parte de [BACKEND | FRONTEND].

ARQUIVOS ANEXADOS
- constitution.md: princípios, stack e versões. Tem prioridade sobre qualquer sugestão sua.
- arquitetura.md: regras de negócio (RN-xx), modelo de dados e padrões da API.
- plano-do-projeto.md e o PDF de diretrizes: escopo, entregas e critérios de avaliação.
- spec.md, plan.md e tasks.md da funcionalidade [NNN-nome]: o que será feito agora.
- DOCUMENTACAO_IA.md: registro do uso de IA, que eu preencho.

REGRAS
1. Não deduza nada. Se faltar informação, ou se houver conflito ou ambiguidade entre os arquivos, pergunte antes de gerar.
2. Código, nomes de variáveis, rotas da API e enums em inglês. Interface, mensagens ao usuário, documentação e commits em português do Brasil.
3. TypeScript estrito. Respeite a stack e as versões da constituição, sem trocar bibliotecas por conta própria.
4. Contrato da API é o do plan.md. Se achar que ele precisa mudar, avise antes e não implemente por conta própria.
5. Trabalhe uma tarefa do tasks.md por vez, na ordem. Para cada tarefa, entregue: os arquivos criados ou alterados, os comandos para rodar e testar, e a mensagem de commit em Semantic Commits (a que está no tasks.md, ajustada se necessário). Eu faço os commits, você não.
6. Não implemente nada fora do escopo da spec (veja "Fora de escopo").
7. Explique brevemente as decisões não óbvias, pois preciso entender o código para defendê-lo na apresentação.
8. Ao terminar cada funcionalidade, me entregue a linha para o DOCUMENTACAO_IA.md (problema, prompts usados, refinamento, decisão de engenharia).

[SOMENTE FRONTEND]
- Next.js (App Router) + React + TypeScript + Tailwind CSS + Recharts, mobile-first, somente em português do Brasil.
- A API é consumida conforme o plan.md. Enquanto o backend não estiver pronto, use dados simulados (mock) isolados em uma camada de serviços, para trocar pela API real sem refazer as telas.
- URL da API vem de NEXT_PUBLIC_API_URL.
- Respeite as regras de permissão da arquitetura.md (por exemplo, aluno com personal só visualiza treino; use o campo readOnly da API).
- Estados de carregamento, erro e vazio em todas as telas.

[SOMENTE BACKEND]
- Node.js 22, Express, TypeScript, Prisma, PostgreSQL 16 (Docker Compose), Zod, JWT + bcrypt, Swagger.
- Camadas: routes, controllers, services, prisma. Regra de negócio fica nos services.
- Erros padronizados e autorização checada em toda rota protegida.

CONTINUIDADE (esta conversa será usada durante todo o projeto)
- Vamos trabalhar em uma única conversa, funcionalidade por funcionalidade (000 a 006). Mantenha o contexto e as decisões já tomadas aqui.
- Quando eu enviar "PRÓXIMA FUNCIONALIDADE: NNN-nome" com o spec.md, plan.md e tasks.md anexados, trate-a como a nova funcionalidade em andamento e repita o PRIMEIRO PASSO para ela, sem gerar código antes do meu "pode começar".
- Se eu anexar uma versão nova de algum arquivo já enviado (por exemplo, um plan.md com o contrato alterado), a versão nova substitui a antiga. Diga o que mudou em relação à anterior.
- Se a conversa ficar longa e você começar a perder detalhes, avise-me para eu reenviar os arquivos de base.

PRIMEIRO PASSO (não gere código ainda)
1. Resuma em até 10 linhas o que entendeu do projeto e da funcionalidade [NNN-nome].
2. Liste as regras de negócio (RN-xx) que se aplicam a ela.
3. Aponte conflitos, lacunas ou dúvidas nos arquivos.
4. Proponha a ordem de execução das tarefas e aguarde meu "pode começar".
```

### Mensagem curta para cada nova funcionalidade (na mesma conversa)

Anexe `spec.md`, `plan.md` e `tasks.md` da próxima funcionalidade e envie:

```text
PRÓXIMA FUNCIONALIDADE: [NNN-nome]

Os arquivos dela estão anexados. A anterior ([NNN-nome anterior]) está concluída e commitada; me entregue agora a linha do DOCUMENTACAO_IA.md dela, se ainda não entregou.
Faça o PRIMEIRO PASSO para esta funcionalidade (resumo, regras RN-xx, dúvidas e ordem das tarefas) e aguarde meu "pode começar".
```

## 4. Conferência rápida

Antes de aprovar o "pode começar", confira se a resposta da IA:

- [ ] cita as regras RN-xx corretas da funcionalidade;
- [ ] menciona a stack certa (Express + Prisma no backend; Next.js + Tailwind no frontend);
- [ ] fala em código em inglês e interface em português;
- [ ] não inventou endpoints diferentes dos do `plan.md`.

Se errar algo, corrija na conversa e, se for o caso, ajuste o arquivo em `docs/` e faça um commit `docs: ...`.

## 5. Durante o trabalho

- **Mudou o contrato da API?** Atualize o `plan.md`, faça commit e avise o parceiro.
- **A conversa ficou longa ou a IA perdeu o contexto?** Reenvie os arquivos de base atualizados na mesma conversa. Se não resolver, abra outra conversa e repita os passos 2 e 3 para a funcionalidade em andamento.
- **Registro obrigatório:** copie os prompts relevantes e as decisões para o `DOCUMENTACAO_IA.md` ao fim de cada funcionalidade. Cada integrante registra os próprios prompts.
- **Nunca commite** sem entender o código gerado. A apresentação é individual.
