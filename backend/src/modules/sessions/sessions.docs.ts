import { errorResponse, forbiddenResponse, unauthorizedResponse } from "../../docs/helpers.js";

/** Documentação OpenAPI das rotas de execução de treino (usada em src/docs/swagger.ts). */

export const sessionsTag = {
  name: "Execução",
  description: "Execução do treino série a série, resumo da sessão e \"da última vez\"",
};

const bearer = [{ bearerAuth: [] }];
const weekdayEnum = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const sessionIdParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador da sessão",
  schema: { type: "string", format: "uuid" },
};
const setIdParam = {
  name: "setId",
  in: "path",
  required: true,
  description: "Identificador da série",
  schema: { type: "string", format: "uuid" },
};

const sessionNotFound = errorResponse("Sessão inexistente ou de outro aluno", "SESSION_NOT_FOUND", "Sessão não encontrada.");
const sessionFinished = errorResponse(
  "Sessão já finalizada",
  "SESSION_FINISHED",
  "Esta sessão já foi finalizada e não aceita alterações.",
);
const validation = errorResponse("Dados inválidos", "VALIDATION_ERROR", "Dados inválidos.");

const setOk = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/LoggedSet" } } },
});

export const sessionsPaths = {
  "/sessions": {
    post: {
      tags: ["Execução"],
      summary: "Inicia a execução de um treino em um dia da semana (STUDENT)",
      description:
        "O treino precisa ser visível ao aluno, não estar arquivado e ter exercícios no dia escolhido. " +
        "Cada exercício vem com `lastPerformance` (\"da última vez\"). O aluno só pode ter uma sessão em andamento.",
      security: bearer,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/StartSessionRequest" } } },
      },
      responses: {
        "201": {
          description: "Sessão iniciada",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SessionView" } } },
        },
        "400": validation,
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": errorResponse("Treino inexistente ou fora do alcance", "WORKOUT_NOT_FOUND", "Treino não encontrado."),
        "409": errorResponse(
          "Já existe sessão em andamento (o id vem em `details.sessionId`)",
          "SESSION_IN_PROGRESS",
          "Você já tem um treino em andamento.",
        ),
        "422": errorResponse(
          "Treino arquivado ou sem exercícios no dia",
          "WORKOUT_ARCHIVED",
          "Treino arquivado não pode ser executado.",
        ),
      },
    },
  },
  "/sessions/current": {
    get: {
      tags: ["Execução"],
      summary: "Retoma a sessão em andamento (STUDENT)",
      description: "Devolve a sessão com as séries já registradas em cada exercício.",
      security: bearer,
      responses: {
        "200": {
          description: "Sessão em andamento",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SessionView" } } },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": errorResponse("Nenhuma sessão em andamento", "NO_ACTIVE_SESSION", "Você não tem treino em andamento."),
      },
    },
  },
  "/sessions/{id}": {
    delete: {
      tags: ["Execução"],
      summary: "Cancela uma sessão em andamento e apaga as séries registradas (STUDENT)",
      security: bearer,
      parameters: [sessionIdParam],
      responses: {
        "204": { description: "Sessão cancelada" },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": sessionNotFound,
        "422": sessionFinished,
      },
    },
  },
  "/sessions/{id}/sets": {
    post: {
      tags: ["Execução"],
      summary: "Registra uma série (STUDENT)",
      description:
        "`weightKg` aceita decimais (até 2 casas, ex.: 7.5) e 0; `reps` é inteiro maior que zero. " +
        "O item deve ser do treino e do dia da sessão. `setNumber` não pode se repetir no mesmo item.",
      security: bearer,
      parameters: [sessionIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/LogSetRequest" } } },
      },
      responses: {
        "201": setOk("Série registrada"),
        "400": errorResponse(
          "Dados inválidos ou item que não pertence à sessão",
          "INVALID_WORKOUT_ITEM",
          "Esse exercício não faz parte do treino desta sessão. Recarregue o treino e tente de novo.",
        ),
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": sessionNotFound,
        "409": errorResponse("Série já registrada", "SET_ALREADY_LOGGED", "Essa série já foi registrada. Edite-a se precisar corrigir."),
        "422": sessionFinished,
      },
    },
  },
  "/sessions/{id}/sets/{setId}": {
    patch: {
      tags: ["Execução"],
      summary: "Corrige carga e/ou repetições de uma série (STUDENT)",
      security: bearer,
      parameters: [sessionIdParam, setIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSetRequest" } } },
      },
      responses: {
        "200": setOk("Série atualizada"),
        "400": validation,
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": errorResponse("Sessão ou série inexistente", "SET_NOT_FOUND", "Série não encontrada."),
        "422": sessionFinished,
      },
    },
    delete: {
      tags: ["Execução"],
      summary: "Remove uma série registrada por engano (STUDENT)",
      security: bearer,
      parameters: [sessionIdParam, setIdParam],
      responses: {
        "204": { description: "Série removida" },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": errorResponse("Sessão ou série inexistente", "SET_NOT_FOUND", "Série não encontrada."),
        "422": sessionFinished,
      },
    },
  },
  "/sessions/{id}/finish": {
    post: {
      tags: ["Execução"],
      summary: "Finaliza a sessão e devolve o resumo (STUDENT)",
      description:
        "Volume = soma de carga × repetições. Há recorde pessoal (PR) no exercício cuja maior carga da sessão " +
        "supera a maior carga de sessões finalizadas anteriores; a primeira vez do exercício não conta como PR.",
      security: bearer,
      parameters: [sessionIdParam],
      responses: {
        "200": {
          description: "Sessão finalizada",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SessionSummary" } } },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": sessionNotFound,
        "422": errorResponse(
          "Sessão sem séries ou já finalizada",
          "EMPTY_SESSION",
          "Registre ao menos uma série antes de finalizar, ou cancele o treino.",
        ),
      },
    },
  },
  "/exercises/{id}/last-performance": {
    get: {
      tags: ["Execução"],
      summary: "\"Da última vez\" de um exercício",
      description:
        "Séries da sessão finalizada mais recente em que o aluno fez o exercício, ou `{ \"sets\": [] }`. " +
        "O aluno consulta o próprio histórico; o personal informa `studentId` de um aluno vinculado.",
      security: bearer,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Identificador do exercício",
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "studentId",
          in: "query",
          required: false,
          description: "Obrigatório para PERSONAL; ignorado para aluno",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": {
          description: "Última performance",
          content: { "application/json": { schema: { $ref: "#/components/schemas/LastPerformance" } } },
        },
        "400": errorResponse("`studentId` ausente (personal)", "STUDENT_ID_REQUIRED", "Informe o aluno (studentId)."),
        "401": unauthorizedResponse,
        "404": errorResponse("Exercício ou aluno inexistente", "EXERCISE_NOT_FOUND", "Exercício não encontrado."),
      },
    },
  },
};

const performanceSet = {
  type: "object",
  properties: {
    setNumber: { type: "integer", example: 1 },
    weightKg: { type: "number", example: 7.5 },
    reps: { type: "integer", example: 12 },
  },
};

const lastPerformance = {
  type: "object",
  nullable: true,
  properties: {
    sessionId: { type: "string", format: "uuid" },
    date: { type: "string", format: "date-time" },
    sets: { type: "array", items: performanceSet },
  },
};

export const sessionsSchemas = {
  StartSessionRequest: {
    type: "object",
    required: ["workoutId", "weekday"],
    properties: {
      workoutId: { type: "string", format: "uuid" },
      weekday: { type: "string", enum: weekdayEnum, example: "MONDAY" },
    },
  },
  LogSetRequest: {
    type: "object",
    required: ["workoutItemId", "setNumber", "weightKg", "reps"],
    properties: {
      workoutItemId: { type: "string", format: "uuid" },
      setNumber: { type: "integer", minimum: 1, maximum: 50, example: 1 },
      weightKg: { type: "number", minimum: 0, maximum: 9999.99, example: 7.5 },
      reps: { type: "integer", minimum: 1, maximum: 1000, example: 12 },
    },
  },
  UpdateSetRequest: {
    type: "object",
    properties: {
      weightKg: { type: "number", minimum: 0, maximum: 9999.99, example: 8 },
      reps: { type: "integer", minimum: 1, maximum: 1000, example: 10 },
    },
  },
  LoggedSet: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      workoutItemId: { type: "string", format: "uuid", nullable: true },
      exerciseId: { type: "string", format: "uuid" },
      setNumber: { type: "integer" },
      weightKg: { type: "number", example: 7.5 },
      reps: { type: "integer" },
      completedAt: { type: "string", format: "date-time" },
    },
  },
  LastPerformance: {
    type: "object",
    properties: {
      sessionId: { type: "string", format: "uuid" },
      date: { type: "string", format: "date-time" },
      sets: { type: "array", items: performanceSet },
    },
  },
  SessionView: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      workoutId: { type: "string", format: "uuid" },
      workoutName: { type: "string" },
      weekday: { type: "string", enum: weekdayEnum },
      startedAt: { type: "string", format: "date-time" },
      finishedAt: { type: "string", format: "date-time", nullable: true },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "Use como `workoutItemId` ao registrar séries" },
            order: { type: "integer" },
            exercise: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                muscleGroup: { type: "string" },
                videoEmbedUrl: { type: "string", nullable: true },
              },
            },
            sets: { type: "integer", description: "Séries planejadas" },
            targetReps: { type: "integer" },
            restSeconds: { type: "integer", nullable: true },
            notes: { type: "string", nullable: true },
            lastPerformance,
            loggedSets: { type: "array", items: { $ref: "#/components/schemas/LoggedSet" } },
          },
        },
      },
    },
  },
  SessionSummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      workoutId: { type: "string", format: "uuid" },
      workoutName: { type: "string" },
      weekday: { type: "string", enum: weekdayEnum },
      startedAt: { type: "string", format: "date-time" },
      finishedAt: { type: "string", format: "date-time" },
      durationSeconds: { type: "integer", example: 3300 },
      totalVolumeKg: { type: "number", example: 4120.5 },
      setsCount: { type: "integer", example: 16 },
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            exerciseId: { type: "string", format: "uuid" },
            exerciseName: { type: "string" },
            setsCount: { type: "integer" },
            volumeKg: { type: "number" },
            maxWeightKg: { type: "number" },
            previousBestKg: { type: "number", nullable: true, description: "Maior carga anterior (nulo na primeira vez)" },
          },
        },
      },
      personalRecords: {
        type: "array",
        items: {
          type: "object",
          properties: {
            exerciseId: { type: "string", format: "uuid" },
            exerciseName: { type: "string" },
            weightKg: { type: "number" },
            reps: { type: "integer", description: "Maior repetição entre as séries com a carga recorde" },
            previousBestKg: { type: "number" },
          },
        },
      },
    },
  },
};
