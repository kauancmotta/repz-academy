# Repz

Aplicativo web de acompanhamento de treinos de academia. O personal monta o treino do aluno, o aluno executa série a série e o sistema mostra a evolução de cargas e repetições. Quem não tem personal monta o próprio treino.

Trabalho acadêmico, Ciência da Computação, UNIFACVEST. Disciplinas: Laboratório de Programação e Engenharia de Software (Prof. Willen Leolatto Carneiro).

**Dupla:** Kauan Correia Motta (backend) e Gustavo Madureira (frontend).

## Funcionalidades

- Cadastro e login (e-mail e senha) como **personal** ou **aluno**
- Vínculo por código de convite (uso único, expira em 7 dias)
- Catálogo de exercícios (seed) e exercícios próprios, com vídeo do YouTube opcional
- Treino por dia da semana
- Execução série a série com carga (kg, decimais) e repetições
- Evolução: carga máxima, volume, recorde pessoal (PR), "da última vez" e frequência semanal

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22, Express, TypeScript, Prisma, Zod, nodemon |
| Banco | PostgreSQL 16 (Docker Compose) |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Recharts |
| Docs da API | Swagger (OpenAPI 3) em `/api/docs` |

## Como rodar

> Os passos são atualizados a cada funcionalidade entregue. Estado atual: fundação do backend (000).

Pré-requisitos: Node.js 22.x, Docker e Docker Compose.

```bash
# 1. Banco de dados (PostgreSQL 16 na porta 5432, dados em volume do Docker)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install          # também gera o client do Prisma (postinstall)
npm run dev          # http://localhost:3001  |  Swagger: http://localhost:3001/api/docs
# Verificação: curl http://localhost:3001/api/health  ->  {"status":"ok","database":"up"}
# A partir da funcionalidade 001 (modelos no banco): npm run prisma:migrate
# A partir da funcionalidade 003 (catálogo de exercícios): npm run prisma:seed

# 3. Frontend (outro terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:8080
```

## Estrutura

```
repz-academy/
├── backend/             API (Express + Prisma)
├── frontend/            Interface (Next.js)
├── docs/
│   ├── specs/           Spec-Driven Development (constituição e funcionalidades)
│   ├── kanban-prints/   Evolução do quadro de tarefas
│   ├── arquitetura.md   Arquitetura, regras de negócio e modelo de dados
│   ├── contexto-para-ia.md  Como dar contexto à IA em uma nova sessão
│   └── plano-do-projeto.md
├── docker-compose.yml
├── DOCUMENTACAO_IA.md   Registro do uso de IA
└── README.md
```

## Documentação

- Constituição e specs: [`docs/specs/`](docs/specs/constitution.md)
- Arquitetura e regras de negócio: [`docs/arquitetura.md`](docs/arquitetura.md)
- Plano do projeto: [`docs/plano-do-projeto.md`](docs/plano-do-projeto.md)
- Contexto para IA (nova sessão): [`docs/contexto-para-ia.md`](docs/contexto-para-ia.md)
- Uso de IA: [`DOCUMENTACAO_IA.md`](DOCUMENTACAO_IA.md)

## Convenção de commits

Semantic Commits: `feat`, `fix`, `docs`, `chore`, `refactor`. Exemplo: `feat: cria rota de convite de aluno`.
