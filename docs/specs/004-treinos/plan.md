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
- `readOnly = true` para aluno com personal e para treino arquivado.

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

## Frontend

- Personal: tela de montagem com abas por dia da semana, seletor de exercício (003), campos de séries, repetições, descanso e observação, reordenação dos itens.
- Aluno: "Meu treino" com abas por dia, destaque do dia atual, botão "Iniciar treino" (005).
- Indicação visual de somente leitura.
