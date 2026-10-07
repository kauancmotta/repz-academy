# 000 · Fundação — Plano técnico

## docker-compose.yml (raiz)

- Serviço `db`: `postgres:16`, variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` vindas de `.env` da raiz (ou valores de desenvolvimento), porta `5432`, volume nomeado `repz_pgdata`, `healthcheck` com `pg_isready`.

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/env.ts          # leitura e validação (Zod) das variáveis
│   ├── lib/prisma.ts          # instância única do PrismaClient
│   ├── middlewares/
│   │   ├── error-handler.ts
│   │   └── validate.ts        # valida body/query/params com Zod
│   ├── errors/app-error.ts    # AppError(status, code, message)
│   ├── modules/               # um diretório por funcionalidade
│   ├── docs/swagger.ts        # OpenAPI base
│   ├── app.ts                 # configura Express
│   └── server.ts              # sobe o servidor
├── .env.example
├── nodemon.json
├── package.json
└── tsconfig.json
```

Dependências: `express`, `cors`, `zod`, `@prisma/client`, `swagger-ui-express`, `jsonwebtoken`, `bcryptjs`.
Dev: `typescript`, `tsx`, `nodemon`, `prisma`, tipos (`@types/*`).

Scripts: `dev` (nodemon + tsx), `build`, `start`, `prisma:migrate`, `prisma:seed`.

Variáveis (`.env.example`): `PORT=3333`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `FRONTEND_URL=http://localhost:3000`.

### Contrato

| Método | Rota | Resposta |
|---|---|---|
| GET | `/api/health` | 200 `{ "status": "ok", "database": "up" }` |
| GET | `/api/docs` | Swagger UI |

## Frontend

```
frontend/
├── src/
│   ├── app/            # App Router (layout.tsx, page.tsx)
│   ├── components/
│   ├── lib/api.ts      # cliente HTTP (fetch) com base em NEXT_PUBLIC_API_URL
│   └── types/
├── .env.example        # NEXT_PUBLIC_API_URL=http://localhost:3333/api
└── tailwind config
```

Layout mobile-first: cabeçalho, área de conteúdo, navegação inferior em telas pequenas.

## Decisões

- `tsx` em vez de `ts-node` para execução em desenvolvimento (mais simples).
- Um módulo por funcionalidade em `src/modules/<nome>/` com `routes`, `controller`, `service`, `schemas`.
