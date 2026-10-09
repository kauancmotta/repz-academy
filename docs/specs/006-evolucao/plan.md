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

## Decisões de implementação

- **Agregação em memória:** uma consulta traz as séries das sessões finalizadas do aluno e as funções puras de `calculations.ts` fazem o resto (em vez de `groupBy` ou `$queryRaw`). Facilita a conferência manual (ver `conferencia-calculos.md`) e o volume de dados por aluno é pequeno. Se um dia crescer, a consulta pode ser filtrada por período.
- **Sem migration:** a 006 não cria models.
- **PR:** varredura cronológica por `finishedAt`; a carga da sessão deve superar o máximo acumulado anterior. A primeira sessão do exercício e a carga igual não são PR. Mesma definição do resumo ao finalizar a sessão (005).
- **Campos além do contrato inicial:** `volumeChangePct` e `muscleGroup` na lista de exercícios; `setsCount`, `weightChangePct` e `volumeChangePct` na série temporal; `previousBestKg` nos recordes; `totalSessions` na visão geral.
- **Variação:** última sessão vs. anterior, em %, com 1 casa decimal; nula com menos de 2 sessões.
- **Recorde atual (`personalRecord`):** maior carga já usada, na primeira vez em que foi atingida, com as repetições feitas naquela sessão.
- **Frequência:** semana começa na segunda, no fuso America/Sao_Paulo (domingo à noite local conta na semana que termina). `weeks` de 1 a 52 (padrão 8), com zeros nas semanas vazias.
- **Histórico:** `limit` 1 a 100 (padrão 20), `offset` a partir de 0. Sessões em andamento não aparecem.
- **Visão geral:** últimos 5 recordes do aluno. Tem rota própria, `GET /api/students/:studentId/overview` (somente personal).
- **Autorização:** `resolveTargetStudent` (em `links.access.ts`) vale para as rotas de aluno e personal: aluno sempre vê os próprios dados (o `studentId` é ignorado); personal precisa de aluno vinculado, senão 404 (inclui ex-alunos). Após trocar de personal, o antigo perde o acesso e o novo vê todo o histórico.

## Frontend (Recharts)

- Aluno: lista de exercícios, gráfico de linha da carga máxima com marcador de PR, gráfico de barras do volume por sessão, gráfico de barras da frequência semanal, histórico de sessões.
- Personal: seleciona o aluno e vê os mesmos gráficos mais o painel `overview` (última atividade, frequência, PRs recentes).
- Estados vazios amigáveis ("Faça seu primeiro treino para ver a evolução").
