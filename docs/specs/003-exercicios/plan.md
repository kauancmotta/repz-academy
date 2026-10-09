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

## Decisões de implementação

- **Busca sem acento:** filtro em memória com `normalize("NFD")`, sem a extensão `unaccent`. O catálogo é pequeno (50 globais + os do usuário) e a abordagem evita depender de extensão do PostgreSQL na migration. O grupo muscular é filtrado no banco.
- **Nome duplicado (409):** comparado sem diferenciar acentos nem maiúsculas, somente entre os exercícios do próprio usuário. Um usuário pode criar um nome igual ao de um exercício global.
- **Remoção em uso (409):** não há verificação manual. Quando treinos (004) e sessões (005) tiverem chave estrangeira para `Exercise` (sem `onDelete`, ou seja, restrita), o banco recusa a exclusão e o serviço converte o erro (`P2003`) em `EXERCISE_IN_USE`. Nenhuma alteração será necessária na 003 depois.
- **403 em vez de 404:** exercício global ou de outro usuário retorna 403, como pede a spec. Id inexistente retorna 404 `EXERCISE_NOT_FOUND`.
- **Vídeo:** guarda-se o link original em `videoUrl`; `videoEmbedUrl` é calculado na resposta. Aceita `youtube.com`, `www.youtube.com`, `m.youtube.com` e `youtu.be`. Texto vazio em `description` ou `videoUrl` limpa o campo (vira `null`).
- **Seed:** 52 exercícios em 9 grupos (o grupo `OTHER` fica para exercícios criados pelos usuários). Idempotente: se o exercício global já existe, atualiza grupo e descrição.

## Frontend

- Seletor de exercício com busca e filtro por grupo muscular (usado na montagem do treino).
- Formulário de novo exercício.
- Componente de vídeo: `<iframe>` com `videoEmbedUrl`, carregamento sob demanda.
