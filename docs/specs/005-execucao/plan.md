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

## Decisões de implementação

- **Uma sessão aberta por aluno:** `pg_advisory_xact_lock` por aluno dentro de uma transação serializa inícios simultâneos (testado com 4 requisições ao mesmo tempo: 1 vence, 3 recebem 409). Um índice único parcial exigiria editar a migration à mão.
- **Visibilidade só no início:** o treino precisa ser visível e ativo ao iniciar. Depois, a sessão pertence ao aluno e continua mesmo que ele troque de personal.
- **Edição do treino durante a sessão:** os itens ganham novos ids. Registrar série com id antigo retorna 400 `INVALID_WORKOUT_ITEM` e o frontend deve recarregar `GET /sessions/current`. As séries já gravadas continuam no banco e no histórico (a evolução usa `exerciseId`).
- **Séries extras:** `setNumber` vai de 1 a 50, sem limitar à meta do treino.
- **Carga:** número com no máximo 2 casas decimais, de 0 a 9999,99 (0 permite exercício com peso do corpo). O volume é calculado em centésimos de kg para evitar erro de ponto flutuante (7,1 × 3 = 21,3).
- **PR:** calculado por exercício no resumo, comparando a maior carga da sessão com a maior carga de sessões finalizadas **antes** dela (`finishedAt` menor). Uma entrada por exercício, com `previousBestKg`. Carga igual não é PR. A função `buildSessionSummary` fica reutilizável pela 006.
- **Resumo da sessão** traz também `exercises` (séries, volume, carga máxima e melhor anterior por exercício), útil para a tela de resumo.
- **"Da última vez"** vem junto dos itens ao iniciar e retomar a sessão, e também por `GET /exercises/:id/last-performance`.
- **Cancelar** apaga a sessão e as séries (cascata). Sessão finalizada não pode ser cancelada (422).
- **Remoções protegidas:** a chave estrangeira restrita de `WorkoutSession.workoutId` e `SetLog.exerciseId` faz treino e exercício com histórico retornarem 409.
- **005.11:** `GET /students` calcula `lastSessionAt` com `groupBy` das sessões finalizadas.

## Frontend

- Fluxo série a série: cartão do exercício atual, indicador "série 2 de 4", "Da última vez: 40 kg × 10", campos de carga e repetições (teclado numérico), botão "Concluir série".
- Cronômetro de descanso entre séries.
- Tela de resumo com volume e PRs.
- Retomar sessão em andamento ao abrir o app.
