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
- Painel do personal: lista de alunos com data do último treino e visão geral da evolução de cada um

## Status

Backend completo (funcionalidades 000 a 006), documentado no Swagger e verificado contra a API. O frontend está em desenvolvimento por Gustavo.

| # | Funcionalidade | Status |
|---|---|---|
| 000 | Fundação (monorepo, banco, health check, Swagger) | Concluída |
| 001 | Autenticação | Concluída |
| 002 | Vínculo personal e aluno | Concluída |
| 003 | Catálogo de exercícios | Concluída |
| 004 | Treinos | Concluída |
| 005 | Execução do treino | Concluída |
| 006 | Evolução | Concluída |
| Frontend | Telas | Em desenvolvimento |

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22, Express, TypeScript, Prisma, Zod, nodemon |
| Banco | PostgreSQL 16 (Docker Compose) |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Recharts |
| Docs da API | Swagger (OpenAPI 3) em `/api/docs` |

## Como rodar

Pré-requisitos: Node.js 22.x, Docker e Docker Compose.

```bash
# 1. Banco de dados (PostgreSQL 16 na porta 5432, dados em volume do Docker)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install          # também gera o client do Prisma (postinstall)
npm run prisma:migrate   # aplica as migrations no banco
npm run prisma:seed      # catálogo de exercícios (52 exercícios globais; pode rodar mais de uma vez)
npm run prisma:seed:demo # opcional: contas e histórico de exemplo para demonstração (ver abaixo)
npm run dev          # http://localhost:3001  |  Swagger: http://localhost:3001/api/docs
# Verificação: curl http://localhost:3001/api/health  ->  {"status":"ok","database":"up"}

# 3. Frontend (outro terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:8080
```

### Variáveis de ambiente do backend (`backend/.env`)

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3001` | Porta da API |
| `FRONTEND_URL` | `http://localhost:8080` | Origem liberada no CORS |
| `DATABASE_URL` | `postgresql://repz:repz@localhost:5432/repz?schema=public` | Conexão com o PostgreSQL |
| `JWT_SECRET` | `troque-este-segredo-em-desenvolvimento` | Segredo do token; troque fora do desenvolvimento |
| `JWT_EXPIRES_IN` | `7d` | Validade da sessão |

### Scripts do backend

| Comando | O que faz |
|---|---|
| `npm run dev` | API com recarga automática |
| `npm run build` e `npm start` | Compila e roda a versão de produção |
| `npm run typecheck` | Verifica os tipos |
| `npm run prisma:migrate -- --name <nome>` | Cria e aplica uma migration e regenera o client |
| `npm run prisma:seed` | Catálogo de 52 exercícios |
| `npm run prisma:seed:demo` | Contas e histórico de demonstração |

### Solução de problemas

- **`Cannot read properties of undefined (reading 'findFirst')` ou erro de tipo do Prisma:** o client está desatualizado. Rode `npx prisma generate` em `backend/`.
- **`Can't reach database server`:** confirme `docker compose up -d` e o `DATABASE_URL` do `.env`.
- **Tabela inexistente:** rode `npm run prisma:migrate`.
- **Porta ocupada:** altere `PORT` no `.env` (e `FRONTEND_URL`, se mudar a do frontend).

## Dados de demonstração

O comando `npm run prisma:seed:demo` (depois do `prisma:seed`) cria contas de exemplo com cerca de 8 semanas de histórico, para apresentar o sistema e desenvolver o frontend com dados reais. Pode ser rodado de novo a qualquer momento: ele apaga e recria só as contas `@demo.repz.app`, e as datas são sempre relativas a hoje.

Senha de todas as contas: `senha12345`

| Perfil | E-mail | Situação |
|---|---|---|
| Personal | `carlos@demo.repz.app` | Tem os alunos Maria e João |
| Personal | `beatriz@demo.repz.app` | Sem alunos; tem o convite `REPZDEMO` |
| Aluno | `maria@demo.repz.app` | Com personal. Treino ABC (seg/qua/sex), 17 sessões, cargas em evolução e recordes |
| Aluno | `joao@demo.repz.app` | Com personal. Full body (seg/qui), treinou 3 semanas e **parou** |
| Aluno | `ana@demo.repz.app` | **Sem personal**. Treino próprio em casa (ter/qui), um treino arquivado |

Roteiros rápidos de demonstração:

- **Evolução:** entre como Maria e abra a evolução do Supino reto (cargas crescentes com recordes marcados) e a frequência semanal.
- **Painel do personal:** entre como Carlos e veja que o João não treina há semanas.
- **Vínculo:** entre como Ana, resgate o código `REPZDEMO` e veja o treino próprio dela ficar somente leitura. Rode o seed de novo para voltar ao estado inicial.
- **Execução:** a Maria treina de segunda, quarta e sexta; nesses dias o "treino de hoje" já vem preenchido. Em outros dias, ela pode iniciar qualquer dia da semana pela lista de treinos.

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
│   ├── kanban.md        Como o Kanban (GitHub Projects) é usado
│   └── plano-do-projeto.md
├── scripts/             Scripts do projeto (criar-kanban.sh)
├── docker-compose.yml
├── DOCUMENTACAO_IA.md   Registro do uso de IA
└── README.md
```

## Documentação

- Constituição e specs: [`docs/specs/`](docs/specs/constitution.md)
- Arquitetura e regras de negócio: [`docs/arquitetura.md`](docs/arquitetura.md)
- Plano do projeto: [`docs/plano-do-projeto.md`](docs/plano-do-projeto.md)
- Gestão das tarefas (Kanban): [`docs/kanban.md`](docs/kanban.md)
- Contexto para IA (nova sessão): [`docs/contexto-para-ia.md`](docs/contexto-para-ia.md)
- Uso de IA: [`DOCUMENTACAO_IA.md`](DOCUMENTACAO_IA.md)
- API interativa: Swagger em `http://localhost:3001/api/docs` com o backend rodando

## Fluxo de trabalho (SDD)

Cada funcionalidade segue Spec-Driven Development: especificação, plano, tarefas, implementação, commit semântico e registro em `DOCUMENTACAO_IA.md`. As specs ficam em `docs/specs/NNN-nome/`.

## Convenção de commits

Semantic Commits: `feat`, `fix`, `docs`, `chore`, `refactor`. Exemplo: `feat: cria rota de convite de aluno`.

## Equipe

| Pessoa | Papel |
|---|---|
| Kauan Correia Motta | Backend, banco de dados e documentação |
| Gustavo Madureira | Frontend |
