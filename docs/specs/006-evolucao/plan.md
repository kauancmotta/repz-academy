# 006 · Evolução — Plano técnico

Não há novos models: as métricas são calculadas a partir de `WorkoutSession` e `SetLog`.

## Contrato da API (autenticado)

Para PERSONAL, `studentId` é obrigatório e deve ser de aluno vinculado. Para STUDENT, é ignorado.

### GET `/api/progress/exercises?studentId=`

Exercícios com histórico:
`[{ "exerciseId", "name", "muscleGroup", "sessionsCount", "lastMaxWeightKg", "weightChangePct", "lastSessionAt" }]`

### GET `/api/progress/exercises/:exerciseId?studentId=`

```json
{
  "exercise": { "id": "uuid", "name": "Supino reto" },
  "points": [
    { "sessionId": "uuid", "date": "2026-10-12T22:00:00Z", "maxWeightKg": 40, "repsAtMax": 10, "volumeKg": 1200, "isPersonalRecord": false }
  ],
  "personalRecord": { "weightKg": 45, "reps": 8, "date": "..." }
}
```

### GET `/api/progress/frequency?studentId=&weeks=8`

`[{ "weekStart": "2026-10-05", "sessions": 3 }]`

### GET `/api/progress/sessions?studentId=&limit=20&offset=0`

`{ "total": 12, "items": [{ "id", "workoutName", "weekday", "startedAt", "finishedAt", "durationSeconds", "totalVolumeKg", "setsCount" }] }`

### GET `/api/progress/sessions/:id?studentId=`

Detalhe da sessão com séries agrupadas por exercício.

### GET `/api/students/:studentId/overview` (PERSONAL)

`{ "student": {id, name}, "lastSessionAt", "sessionsLast30Days", "weeklyFrequency": [...], "recentPersonalRecords": [...] }`

## Implementação

- Agregações com `prisma.setLog.groupBy` ou `$queryRaw` (decidir na implementação e registrar no `DOCUMENTACAO_IA.md`). Agrupar por `sessionId` + `exerciseId`.
- Considerar apenas sessões com `finishedAt` não nulo.
- PR por varredura cronológica: carga corrente > máximo acumulado anterior.
- Semana começando na segunda-feira, fuso `America/Sao_Paulo`.
- Funções de cálculo (volume, PR, variação) separadas em `src/modules/progress/calculations.ts`, sem acesso ao banco, para facilitar a conferência manual com exemplos.
- Autorização reutiliza `assertStudentOfPersonal` (002).
- Módulo: `src/modules/progress/`.

## Frontend (Recharts)

- Aluno: lista de exercícios, gráfico de linha da carga máxima com marcador de PR, gráfico de barras do volume por sessão, gráfico de barras da frequência semanal, histórico de sessões.
- Personal: seleciona o aluno e vê os mesmos gráficos mais o painel `overview` (última atividade, frequência, PRs recentes).
- Estados vazios amigáveis ("Faça seu primeiro treino para ver a evolução").
