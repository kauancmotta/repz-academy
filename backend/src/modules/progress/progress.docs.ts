import { errorResponse, forbiddenResponse, unauthorizedResponse } from "../../docs/helpers.js";

/** Documentação OpenAPI das rotas de evolução (usada em src/docs/swagger.ts). */

export const progressTag = {
  name: "Evolução",
  description:
    "Métricas calculadas a partir das sessões finalizadas. O aluno vê os próprios dados; o personal informa " +
    "`studentId` de um aluno vinculado a ele.",
};

const bearer = [{ bearerAuth: [] }];
const weekdayEnum = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const studentIdQuery = {
  name: "studentId",
  in: "query",
  required: false,
  description: "Obrigatório para PERSONAL (aluno vinculado); ignorado para aluno",
  schema: { type: "string", format: "uuid" },
};

const studentIdRequired = errorResponse("`studentId` ausente (personal)", "STUDENT_ID_REQUIRED", "Informe o aluno (studentId).");
const studentNotFound = errorResponse(
  "Aluno não vinculado ao personal (inclui ex-alunos)",
  "STUDENT_NOT_FOUND",
  "Aluno não encontrado entre os seus alunos.",
);

const json = (ref: string) => ({ "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } });
const jsonArray = (ref: string) => ({
  "application/json": { schema: { type: "array", items: { $ref: `#/components/schemas/${ref}` } } },
});

export const progressPaths = {
  "/progress/exercises": {
    get: {
      tags: ["Evolução"],
      summary: "Exercícios com histórico e variação da última sessão",
      description:
        "Só considera sessões finalizadas. Do exercício treinado mais recentemente para o mais antigo. " +
        "Sem histórico, devolve lista vazia.",
      security: bearer,
      parameters: [studentIdQuery],
      responses: {
        "200": { description: "Exercícios com histórico", content: jsonArray("ProgressExercise") },
        "400": studentIdRequired,
        "401": unauthorizedResponse,
        "404": studentNotFound,
      },
    },
  },
  "/progress/exercises/{exerciseId}": {
    get: {
      tags: ["Evolução"],
      summary: "Evolução de um exercício, sessão a sessão",
      description:
        "Um ponto por sessão finalizada, em ordem cronológica: carga máxima, repetições na carga máxima, volume e " +
        "`isPersonalRecord` (carga máxima maior que a de todas as sessões anteriores; a primeira sessão nunca é PR). " +
        "`personalRecord` é a maior carga já usada (na primeira vez em que foi atingida). Sem histórico: `points` vazio.",
      security: bearer,
      parameters: [
        {
          name: "exerciseId",
          in: "path",
          required: true,
          description: "Identificador do exercício",
          schema: { type: "string", format: "uuid" },
        },
        studentIdQuery,
      ],
      responses: {
        "200": { description: "Série temporal do exercício", content: json("ExerciseProgress") },
        "400": studentIdRequired,
        "401": unauthorizedResponse,
        "404": errorResponse("Exercício inexistente ou aluno não vinculado", "EXERCISE_NOT_FOUND", "Exercício não encontrado."),
      },
    },
  },
  "/progress/frequency": {
    get: {
      tags: ["Evolução"],
      summary: "Frequência semanal",
      description:
        "Sessões finalizadas por semana (a semana começa na segunda, fuso America/Sao_Paulo), da mais antiga para " +
        "a semana atual. Semanas sem treino aparecem com zero.",
      security: bearer,
      parameters: [
        studentIdQuery,
        {
          name: "weeks",
          in: "query",
          required: false,
          description: "Quantidade de semanas (1 a 52)",
          schema: { type: "integer", minimum: 1, maximum: 52, default: 8 },
        },
      ],
      responses: {
        "200": { description: "Frequência por semana", content: jsonArray("WeeklyFrequency") },
        "400": errorResponse("Parâmetro inválido ou `studentId` ausente (personal)", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "404": studentNotFound,
      },
    },
  },
  "/progress/sessions": {
    get: {
      tags: ["Evolução"],
      summary: "Histórico de sessões finalizadas (paginado)",
      description: "Da mais recente para a mais antiga.",
      security: bearer,
      parameters: [
        studentIdQuery,
        { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        { name: "offset", in: "query", required: false, schema: { type: "integer", minimum: 0, default: 0 } },
      ],
      responses: {
        "200": { description: "Página de sessões", content: json("SessionHistory") },
        "400": errorResponse("Parâmetro inválido ou `studentId` ausente (personal)", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "404": studentNotFound,
      },
    },
  },
  "/progress/sessions/{id}": {
    get: {
      tags: ["Evolução"],
      summary: "Detalhe de uma sessão finalizada, com as séries de cada exercício",
      security: bearer,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Identificador da sessão",
          schema: { type: "string", format: "uuid" },
        },
        studentIdQuery,
      ],
      responses: {
        "200": { description: "Sessão detalhada", content: json("SessionDetail") },
        "400": studentIdRequired,
        "401": unauthorizedResponse,
        "404": errorResponse("Sessão inexistente, em andamento ou de outro aluno", "SESSION_NOT_FOUND", "Sessão não encontrada."),
      },
    },
  },
  "/students/{studentId}/overview": {
    get: {
      tags: ["Evolução"],
      summary: "Visão geral de um aluno para o personal (PERSONAL)",
      description: "Última atividade, sessões nos últimos 30 dias, frequência das últimas 8 semanas e os 5 recordes mais recentes.",
      security: bearer,
      parameters: [
        {
          name: "studentId",
          in: "path",
          required: true,
          description: "Identificador do aluno",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": { description: "Visão geral do aluno", content: json("StudentOverview") },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
        "404": studentNotFound,
      },
    },
  },
};

const prShape = {
  exerciseId: { type: "string", format: "uuid" },
  exerciseName: { type: "string", example: "Supino reto com barra" },
  weightKg: { type: "number", example: 45 },
  reps: { type: "integer", example: 6 },
  previousBestKg: { type: "number", example: 42.5 },
  date: { type: "string", format: "date-time" },
  sessionId: { type: "string", format: "uuid" },
};

export const progressSchemas = {
  ProgressExercise: {
    type: "object",
    properties: {
      exerciseId: { type: "string", format: "uuid" },
      name: { type: "string" },
      muscleGroup: { type: "string", example: "CHEST" },
      sessionsCount: { type: "integer", example: 4 },
      lastMaxWeightKg: { type: "number", example: 45 },
      weightChangePct: { type: "number", nullable: true, example: 5.9, description: "Carga máxima: última sessão vs. anterior (%)" },
      volumeChangePct: { type: "number", nullable: true, example: -26.1, description: "Volume: última sessão vs. anterior (%)" },
      lastSessionAt: { type: "string", format: "date-time" },
    },
  },
  ExerciseProgress: {
    type: "object",
    properties: {
      exercise: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          muscleGroup: { type: "string" },
        },
      },
      points: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sessionId: { type: "string", format: "uuid" },
            date: { type: "string", format: "date-time" },
            maxWeightKg: { type: "number", example: 42.5 },
            repsAtMax: { type: "integer", example: 8 },
            volumeKg: { type: "number", example: 1080 },
            setsCount: { type: "integer", example: 3 },
            isPersonalRecord: { type: "boolean" },
          },
        },
      },
      personalRecord: {
        type: "object",
        nullable: true,
        properties: {
          weightKg: { type: "number", example: 45 },
          reps: { type: "integer", example: 6 },
          date: { type: "string", format: "date-time" },
          sessionId: { type: "string", format: "uuid" },
        },
      },
      weightChangePct: { type: "number", nullable: true },
      volumeChangePct: { type: "number", nullable: true },
    },
  },
  WeeklyFrequency: {
    type: "object",
    properties: {
      weekStart: { type: "string", format: "date", example: "2026-10-05", description: "Segunda-feira da semana" },
      sessions: { type: "integer", example: 3 },
    },
  },
  SessionHistory: {
    type: "object",
    properties: {
      total: { type: "integer", example: 12 },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            workoutName: { type: "string" },
            weekday: { type: "string", enum: weekdayEnum },
            startedAt: { type: "string", format: "date-time" },
            finishedAt: { type: "string", format: "date-time" },
            durationSeconds: { type: "integer" },
            totalVolumeKg: { type: "number" },
            setsCount: { type: "integer" },
          },
        },
      },
    },
  },
  SessionDetail: {
    allOf: [
      { $ref: "#/components/schemas/SessionSummary" },
      {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            description: "Mesmos campos do resumo, mais as séries de cada exercício",
            items: {
              type: "object",
              properties: {
                exerciseId: { type: "string", format: "uuid" },
                exerciseName: { type: "string" },
                setsCount: { type: "integer" },
                volumeKg: { type: "number" },
                maxWeightKg: { type: "number" },
                previousBestKg: { type: "number", nullable: true },
                sets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      setNumber: { type: "integer" },
                      weightKg: { type: "number" },
                      reps: { type: "integer" },
                      completedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  StudentOverview: {
    type: "object",
    properties: {
      student: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
      },
      lastSessionAt: { type: "string", format: "date-time", nullable: true },
      totalSessions: { type: "integer" },
      sessionsLast30Days: { type: "integer" },
      weeklyFrequency: { type: "array", items: { $ref: "#/components/schemas/WeeklyFrequency" } },
      recentPersonalRecords: { type: "array", items: { type: "object", properties: prShape } },
    },
  },
};
