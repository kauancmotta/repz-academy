# 003 · Exercícios — Plano técnico

## Modelo (Prisma)

```prisma
enum MuscleGroup { CHEST BACK SHOULDERS BICEPS TRICEPS LEGS GLUTES CORE CARDIO OTHER }

model Exercise {
  id          String      @id @default(uuid())
  name        String
  muscleGroup MuscleGroup
  description String?
  videoUrl    String?
  createdById String?
  createdBy   User?       @relation(fields: [createdById], references: [id])
  createdAt   DateTime    @default(now())

  @@unique([name, createdById])
}
```

`createdById = null` identifica exercício global (seed). O seed usa `upsert` por `name` com `createdById` nulo para ser idempotente (como o `@@unique` não trata `NULL` como igual no PostgreSQL, o seed faz `findFirst` antes de criar).

## Contrato da API (autenticado)

### GET `/api/exercises?search=&muscleGroup=`

- 200: `[{ "id", "name", "muscleGroup", "description", "videoUrl", "videoEmbedUrl", "isGlobal": true }]`

### POST `/api/exercises`

Body: `{ "name": "2–100", "muscleGroup": "CHEST", "description?": "string", "videoUrl?": "https://youtu.be/..." }`

- 201: exercício criado · 400 validação · 409 nome já usado por você (`EXERCISE_ALREADY_EXISTS`)

### PATCH `/api/exercises/:id`

Body parcial. 200 · 403 `FORBIDDEN` (global ou de outro usuário) · 404.

### DELETE `/api/exercises/:id`

204 · 403 · 404 · 409 `EXERCISE_IN_USE`.

## Implementação

- Extração do ID do YouTube em `src/modules/exercises/youtube.ts` (função pura, com os formatos aceitos).
- Busca sem acento: `normalize` no serviço (campo `search` comparado com `contains` + `mode: insensitive`; acentos tratados com extensão `unaccent` do PostgreSQL ou filtro em memória, decidir na implementação e registrar no `DOCUMENTACAO_IA.md`).
- Seed em `prisma/seed.ts` com array tipado de exercícios.
- Módulo: `src/modules/exercises/`.

## Frontend

- Seletor de exercício com busca e filtro por grupo muscular (usado na montagem do treino).
- Formulário de novo exercício.
- Componente de vídeo: `<iframe>` com `videoEmbedUrl`, carregamento sob demanda.
