# 001 · Autenticação — Plano técnico

## Modelo (Prisma)

```prisma
enum Role { PERSONAL STUDENT }

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role
  personalId   String?
  personal     User?    @relation("PersonalStudents", fields: [personalId], references: [id])
  students     User[]   @relation("PersonalStudents")
  createdAt    DateTime @default(now())
}
```

## Contrato da API

### POST `/api/auth/register`

Body: `{ "name": "string (2–100)", "email": "email", "password": "string (min 8)", "role": "PERSONAL | STUDENT" }`

- 201: `{ "user": { id, name, email, role } , "token": "jwt" }`
- 400 validação · 409 e-mail já cadastrado (`EMAIL_ALREADY_USED`)

### POST `/api/auth/login`

Body: `{ "email", "password" }`

- 200: `{ "user": { id, name, email, role }, "token": "jwt" }`
- 401 `INVALID_CREDENTIALS`

### GET `/api/auth/me` (autenticado)

- 200: `{ "id", "name", "email", "role", "personal": { "id", "name" } | null }`
- 401 `UNAUTHORIZED`

## Implementação

- Hash com `bcryptjs` (custo 10).
- JWT assinado com `JWT_SECRET`, payload `{ sub: userId, role }`, expiração `JWT_EXPIRES_IN`.
- Middleware `authenticate` lê `Authorization: Bearer`, injeta `req.user = { id, role }`.
- Middleware `requireRole('PERSONAL')` retorna 403 `FORBIDDEN` se o perfil não bater.
- Módulo: `src/modules/auth/` (`auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.schemas.ts`).

## Frontend

- Telas: `/login`, `/cadastro` (com seleção de perfil).
- Token em cookie ou `localStorage` (decisão do frontend; documentar no `DOCUMENTACAO_IA.md`).
- Redirecionamento por perfil após login: personal → painel de alunos, aluno → meu treino.

## Segurança

- Mensagem única para login inválido.
- Nunca retornar `passwordHash`.
- Normalizar e-mail para minúsculas.
