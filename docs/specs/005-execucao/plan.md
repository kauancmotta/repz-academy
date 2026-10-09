# 005 · Execução — Plano técnico

## Modelo (Prisma)

```prisma
model WorkoutSession {
  id         String    @id @default(uuid())
  studentId  String
  student    User      @relation(fields: [studentId], references: [id])
  workoutId  String
  workout    Workout   @relation(fields: [workoutId], references: [id])
  weekday    Weekday
  startedAt  DateTime  @default(now())
  finishedAt DateTime?
  sets       SetLog[]

  @@index([studentId, finishedAt])
}

model SetLog {
  id            String         @id @default(uuid())
  sessionId     String
  session       WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  workoutItemId String?
  exerciseId    String
  exercise      Exercise       @relation(fields: [exerciseId], references: [id])
  setNumber     Int
  weightKg      Decimal        @db.Decimal(6, 2)
  reps          Int
  completedAt   DateTime       @default(now())

  @@unique([sessionId, workoutItemId, setNumber])
  @@index([exerciseId])
}
```

> **Atenção (decidido na 004):** editar um treino substitui os itens com novos ids. `SetLog.workoutItemId` não tem chave estrangeira (é opcional e apenas informativo) e `WorkoutSession.workoutId` deve ter chave estrangeira **restrita** (sem `onDelete`), para que remover treino com sessões retorne 409 `WORKOUT_HAS_SESSIONS`. Ao registrar uma série, o serviço deve validar que `workoutItemId` pertence ao treino da sessão no momento do registro.

## Contrato da API (STUDENT)

### POST `/api/sessions`

Body: `{ "workoutId": "uuid", "weekday": "MONDAY" }`

- 201: sessão com os itens do dia e, para cada exercício, `lastPerformance`.
- 403 · 404 · 409 `SESSION_IN_PROGRESS` (devolve o id da sessão existente) · 422 `WORKOUT_ARCHIVED`

### GET `/api/sessions/current`

- 200: sessão em andamento com séries já registradas · 404 se não houver.

### POST `/api/sessions/:id/sets`

Body: `{ "workoutItemId": "uuid", "setNumber": 1, "weightKg": 7.5, "reps": 12 }`

- 201: série registrada · 400 · 404 · 409 `SET_ALREADY_LOGGED` · 422 `SESSION_FINISHED`

### PATCH `/api/sessions/:id/sets/:setId` · DELETE `/api/sessions/:id/sets/:setId`

200 / 204 · 422 `SESSION_FINISHED`.

### POST `/api/sessions/:id/finish`

- 200: `{ "id", "startedAt", "finishedAt", "durationSeconds", "totalVolumeKg", "setsCount", "personalRecords": [{ "exerciseId", "exerciseName", "weightKg", "reps" }] }`
- 422 `EMPTY_SESSION` · 422 `SESSION_FINISHED`

### DELETE `/api/sessions/:id`

Cancela sessão **em andamento**. 204.

### GET `/api/exercises/:id/last-performance?studentId=`

- 200: `{ "sessionId", "date", "sets": [{ "setNumber", "weightKg", "reps" }] }` ou `{ "sets": [] }`.
- STUDENT: o próprio. PERSONAL: `studentId` de aluno vinculado.

## Implementação

- `lastPerformance`: sessão finalizada mais recente do aluno com `SetLog.exerciseId = exercício`.
- PR calculado no `finish`: para cada exercício da sessão, maior `weightKg` da sessão > maior `weightKg` em sessões finalizadas anteriores (e existir histórico anterior).
- `weightKg` serializado como número no JSON (conversão de `Decimal`).
- Módulo: `src/modules/sessions/`.

## Frontend

- Fluxo série a série: cartão do exercício atual, indicador "série 2 de 4", "Da última vez: 40 kg × 10", campos de carga e repetições (teclado numérico), botão "Concluir série".
- Cronômetro de descanso entre séries.
- Tela de resumo com volume e PRs.
- Retomar sessão em andamento ao abrir o app.
