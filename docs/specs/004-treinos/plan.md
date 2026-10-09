# 004 · Treinos — Plano técnico

## Modelo (Prisma)

```prisma
enum Weekday { MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY }

model Workout {
  id         String        @id @default(uuid())
  name       String
  studentId  String
  authorId   String
  student    User          @relation("StudentWorkouts", fields: [studentId], references: [id])
  author     User          @relation("AuthoredWorkouts", fields: [authorId], references: [id])
  archivedAt DateTime?
  items      WorkoutItem[]
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model WorkoutItem {
  id          String   @id @default(uuid())
  workoutId   String
  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exerciseId  String
  exercise    Exercise @relation(fields: [exerciseId], references: [id])
  weekday     Weekday
  order       Int
  sets        Int
  targetReps  Int
  restSeconds Int?
  notes       String?
}
```

## Contrato da API (autenticado)

### POST `/api/workouts`

```json
{
  "name": "Treino A",
  "studentId": "uuid (obrigatório para PERSONAL, ignorado para STUDENT)",
  "items": [
    { "exerciseId": "uuid", "weekday": "MONDAY", "order": 1, "sets": 4, "targetReps": 10, "restSeconds": 60, "notes": "Pausa de 1s embaixo" }
  ]
}
```

- 201: treino completo · 400 · 403 (`STUDENT_HAS_PERSONAL`, `FORBIDDEN`)

### GET `/api/workouts?studentId=&archived=false`

- PERSONAL: `studentId` obrigatório, aluno vinculado; lista treinos em que ele é autor.
- STUDENT: ignora `studentId`; aplica a regra de visibilidade (seção 5 da arquitetura).
- 200: `[{ "id", "name", "authorId", "archivedAt", "itemsCount", "weekdays": ["MONDAY", ...] }]`

### GET `/api/workouts/:id`

- 200: `{ "id", "name", "readOnly": boolean, "days": [{ "weekday": "MONDAY", "items": [{ "id", "order", "exercise": {id, name, muscleGroup, videoEmbedUrl}, "sets", "targetReps", "restSeconds", "notes" }] }] }`
- `readOnly = true` para aluno com personal (inclui os treinos próprios dele, tratados como arquivados por regra) e para treino com `archivedAt` preenchido.

### PUT `/api/workouts/:id`

Mesmo body do POST (sem `studentId`); substitui os itens. 200 · 403 · 404.

### PATCH `/api/workouts/:id/archive` e `/unarchive`

200 · 403 · 404.

### DELETE `/api/workouts/:id`

204 · 409 `WORKOUT_HAS_SESSIONS`.

### GET `/api/workouts/today` (STUDENT)

- 200: `{ "weekday": "MONDAY", "workouts": [{ "id", "name", "items": [...] }] }`

## Implementação

- Função `getVisibleWorkoutAuthorId(student)` centraliza RN-07/RN-08 (seção 5 da arquitetura).
- Edição com `prisma.$transaction`: `deleteMany` dos itens + `createMany`.
- Validação de acesso aos exercícios: globais ou criados pelo autor.
- Dia da semana de "hoje" calculado em `America/Sao_Paulo`.
- Módulo: `src/modules/workouts/`.

## Decisões de implementação

- **Visibilidade** em `workouts.access.ts` (em vez de uma única `getVisibleWorkoutAuthorId`, já que o aluno enxerga dois autores): `visibleToStudent`, `visibleToPersonal`, `isArchivedForStudent` e `isReadOnlyForStudent`. Tudo calculado, nada gravado (RN-09).
- **404 em vez de 403** para recursos fora do alcance (treino de outro personal, de ex-aluno, aluno não vinculado), para não revelar a existência (RN-18). O 403 `STUDENT_HAS_PERSONAL` vale para aluno com personal que tenta criar, editar, arquivar ou remover.
- **Campos extras nas respostas:** `studentId`, `archived` (arquivado para quem vê, incluindo a regra derivada) e `readOnly` na listagem e no detalhe, para o frontend não recalcular regras.
- **Limites de validação:** 1 a 100 itens; séries 1 a 20; repetições 1 a 100; descanso 0 a 3600 s; observação até 300 caracteres. Não pode haver dois itens com a mesma ordem no mesmo dia (também garantido por índice único no banco).
- **Exercícios:** globais ou criados pelo autor do treino. O personal usa os dele; o aluno vê o exercício do personal no treino sem precisar tê-lo.
- **Remoção (409):** a chave estrangeira de `WorkoutSession.workoutId` (005) deve ser restrita; o banco recusa a exclusão e o serviço devolve `WORKOUT_HAS_SESSIONS`. Os itens são apagados em cascata.
- **Editar substitui os itens com novos ids.** Por isso `SetLog.workoutItemId` (005) não tem chave estrangeira e é só um dado de apoio; a evolução usa `exerciseId`.
- **Arquivar e desarquivar** são idempotentes e devolvem o treino completo. Um aluno com personal não vê o próprio treino em "ativos", só em "arquivados".

## Frontend

- Personal: tela de montagem com abas por dia da semana, seletor de exercício (003), campos de séries, repetições, descanso e observação, reordenação dos itens.
- Aluno: "Meu treino" com abas por dia, destaque do dia atual, botão "Iniciar treino" (005).
- Indicação visual de somente leitura.
