# Plano do Projeto Repz

Entrega e apresentação: **04/11/2026** (10 minutos). Dupla: Kauan Correia Motta (backend) e Gustavo Madureira (frontend).

## Metodologia (SDD)

Ciclo por funcionalidade: **spec → plan → tasks → implementação → revisão → commit → DOCUMENTACAO_IA.md**.

```
docs/specs/
├── constitution.md
├── 000-fundacao/        spec.md · plan.md · tasks.md
├── 001-autenticacao/
├── 002-vinculo/
├── 003-exercicios/
├── 004-treinos/
├── 005-execucao/
└── 006-evolucao/
```

## Funcionalidades e responsáveis

| # | Funcionalidade | Backend (Kauan) | Frontend (Gustavo) |
|---|---|---|---|
| 000 | Fundação (infra, base da API, base do front) | Docker, Prisma, Express, Swagger | Next.js, Tailwind, layout base |
| 001 | Autenticação | `/auth/*` | Login e cadastro |
| 002 | Vínculo personal-aluno | Convites e vínculo | Tela de convite e lista de alunos |
| 003 | Exercícios | CRUD e seed | Catálogo, formulário e embed de vídeo |
| 004 | Treinos | CRUD de treino por dia da semana | Montagem e visualização |
| 005 | Execução | Sessão e séries | Tela série a série |
| 006 | Evolução | Métricas e agregações | Gráficos e painel do personal |

## Cronograma

| Período | Backend | Frontend |
|---|---|---|
| 05–11/10 | 000 + 001, specs completas | Setup, layout, login e cadastro (mock) |
| 12–18/10 | 002 + 003 + seeds | Telas do personal (alunos, montar treino) com mock |
| 19–25/10 | 004 + 005 | Treino do aluno, execução série a série |
| 26/10–01/11 | 006, Swagger final, README | Gráficos, integração com a API real |
| 02–04/11 | Manual, DOCUMENTACAO_IA.md, ensaio | Idem |

Os dois trabalham em paralelo a partir do contrato da API definido em cada `plan.md`.

## Gestão (Kanban)

GitHub Projects com colunas **Backlog → Em andamento → Em revisão → Concluído**. Cada tarefa de `tasks.md` vira um card (issue). Prints do quadro em `docs/kanban-prints/` ao final de cada semana.

## Entregáveis

- [ ] Backend e frontend rodando localmente (Docker + Node 22 + Next.js)
- [ ] Repositório com histórico de commits semânticos de ambos
- [ ] `README.md` com instruções de execução
- [ ] Swagger em `/api/docs`
- [ ] `DOCUMENTACAO_IA.md` preenchido por funcionalidade
- [ ] Prints do Kanban
- [ ] Manual do usuário (Google Docs), passo a passo
- [ ] Roteiro da apresentação de 10 minutos

## Mapa dos critérios de avaliação

| Critério (PDF) | Como atendemos |
|---|---|
| Criatividade e Escopo | Evolução de carga, PR, "da última vez", personal sem vínculo com academia |
| Qualidade da Engenharia e Gestão | Camadas, Zod, Kanban, commits semânticos |
| Documentação Analítica | SDD + DOCUMENTACAO_IA.md com revisão crítica |
| Execução Técnica | `docker compose up` + backend + frontend, testado antes de 04/11 |
