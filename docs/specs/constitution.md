# Constituição do Projeto Repz

> Documento fundador do Spec-Driven Development (SDD). Toda decisão técnica deve respeitar este arquivo. Alterações exigem commit próprio (`docs: ...`) e justificativa.

## 1. Visão

**Repz** é um aplicativo web de acompanhamento de treinos de academia.

- O **personal** monta o treino do **aluno**, organizado por dia da semana.
- O **aluno** visualiza o treino e o executa **série a série**, registrando carga (kg) e repetições.
- O **aluno sem personal** monta e edita o próprio treino.
- O sistema guarda o histórico e mostra a **evolução** de carga e repetições para aluno e personal.
- O sistema **não** é vinculado a academia ou organização.

## 2. Equipe e responsabilidades

| Integrante | Responsabilidade principal |
|---|---|
| Kauan Correia Motta | Backend (API, banco, Docker, Swagger) |
| Gustavo Madureira | Frontend (Next.js, Tailwind) |

Ambos documentam o uso de IA no `DOCUMENTACAO_IA.md` e fazem commits com o próprio usuário.

## 3. Stack e versões

| Camada | Tecnologia | Restrição |
|---|---|---|
| Runtime | Node.js | 22.x a 24.x (usado: 22.x) |
| Backend | Express + TypeScript, nodemon (dev) | — |
| ORM | Prisma | — |
| Banco | PostgreSQL via Docker Compose | 15 a 16 (usado: 16) |
| Autenticação | JWT + bcrypt, somente e-mail e senha | — |
| Validação | Zod | — |
| Documentação da API | Swagger (OpenAPI 3) | — |
| Frontend | Next.js + React + TypeScript | — |
| Estilo | Tailwind CSS | mobile-first |
| Gráficos | Recharts | — |
| Idioma da interface | Português do Brasil, somente | — |
| Repositório | Monorepo `repz-academy` (backend/, frontend/, docs/) | — |

## 4. Princípios

1. **Spec antes do código.** Nenhuma funcionalidade é implementada sem `spec.md`, `plan.md` e `tasks.md` em `docs/specs/NNN-nome/`.
2. **Contrato primeiro.** Os endpoints definidos no `plan.md` e no OpenAPI são o acordo entre backend e frontend. Mudança de contrato exige atualizar o plan e avisar o parceiro.
3. **Camadas no backend:** `routes → controllers → services → prisma`. Regra de negócio fica nos services, nunca nos controllers.
4. **Validação na borda** com Zod. Entrada inválida retorna 400 com mensagens claras.
5. **Erros padronizados:** `{ "error": { "code": "...", "message": "..." } }` com status HTTP correto (400, 401, 403, 404, 409, 422).
6. **Segurança:** senha só como hash (bcrypt), nenhum segredo no repositório (`.env.example` versionado, `.env` ignorado), autorização checada em toda rota protegida.
7. **TypeScript estrito** (`strict: true`) em backend e frontend.
8. **Responsivo e mobile-first.** O personal pode montar treinos no desktop, o aluno executa no celular.
9. **Revisão humana do código de IA.** Código gerado só entra após revisão e critérios de aceitação definidos na spec. Cada funcionalidade gera uma linha no `DOCUMENTACAO_IA.md`.
10. **Commits pequenos e semânticos** (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`), refletindo a evolução do sistema.

## 5. Convenções

- Branch principal: `main`. `git pull origin main` antes de começar a trabalhar.
- Cada card do Kanban corresponde a uma tarefa de `tasks.md`.
- Mensagens de commit em português, no formato `tipo: descrição no imperativo`.
- Prints do Kanban salvos em `docs/kanban-prints/` a cada marco.
- *(Proposta, pendente de confirmação)* Identificadores de código e rotas da API em inglês; interface, documentação e commits em português.

## 6. Definição de pronto (DoD)

Uma funcionalidade está pronta quando:

- [ ] Os critérios de aceitação do `spec.md` foram atendidos.
- [ ] Os endpoints estão documentados no Swagger.
- [ ] A regra de negócio foi testada manualmente (Thunder Client ou interface) com os cenários da spec.
- [ ] O `DOCUMENTACAO_IA.md` foi atualizado.
- [ ] O card do Kanban foi movido para "Concluído".
- [ ] O sistema sobe localmente (Docker + backend + frontend) sem erros.

## 7. Fora de escopo

Marketing, vínculo com academias/organizações, login social, recuperação de senha, testes automatizados, 1RM estimado (extra, só se sobrar tempo) e qualquer idioma além do português do Brasil.
