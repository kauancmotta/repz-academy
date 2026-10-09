import { errorResponse, unauthorizedResponse, forbiddenResponse } from "../../docs/helpers.js";

/** Documentação OpenAPI das rotas de treinos (usada em src/docs/swagger.ts). */

export const workoutsTag = {
  name: "Treinos",
  description: "Montagem e visualização de treinos por dia da semana",
};

const bearer = [{ bearerAuth: [] }];
const weekdayEnum = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador do treino",
  schema: { type: "string", format: "uuid" },
};

const notFound = errorResponse(
  "Treino inexistente ou fora do seu alcance (não revela se existe)",
  "WORKOUT_NOT_FOUND",
  "Treino não encontrado.",
);
const hasPersonal = errorResponse(
  "Aluno com personal não altera treinos (RN-07)",
  "STUDENT_HAS_PERSONAL",
  "Você tem um personal vinculado e não pode criar nem alterar treinos. Peça ao seu personal.",
);
const detailOk = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutDetail" } } },
});

export const workoutsPaths = {
  "/workouts": {
    post: {
      tags: ["Treinos"],
      summary: "Cria um treino (PERSONAL para um aluno vinculado, ou ALUNO sem personal para si)",
      description:
        "Personal deve informar `studentId` de um aluno vinculado a ele. Para aluno, `studentId` é ignorado. " +
        "Os exercícios devem ser globais ou criados pelo autor. Não pode haver dois itens com o mesmo `weekday` e `order`.",
      security: bearer,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkoutRequest" } } },
      },
      responses: {
        "201": detailOk("Treino criado"),
        "400": errorResponse(
          "Dados inválidos, `studentId` ausente (personal) ou exercício indisponível",
          "INVALID_EXERCISE",
          "Há exercícios inexistentes ou indisponíveis para você.",
        ),
        "401": unauthorizedResponse,
        "403": hasPersonal,
        "404": errorResponse(
          "Aluno não vinculado ao personal",
          "STUDENT_NOT_FOUND",
          "Aluno não encontrado entre os seus alunos.",
        ),
      },
    },
    get: {
      tags: ["Treinos"],
      summary: "Lista os treinos visíveis ao usuário",
      description:
        "**Personal:** `studentId` é obrigatório; lista os treinos que ele criou para o aluno. " +
        "**Aluno:** `studentId` é ignorado; vê os treinos do personal atual e os próprios. " +
        "Com personal vinculado, os treinos próprios aparecem só em `archived=true`.",
      security: bearer,
      parameters: [
        {
          name: "studentId",
          in: "query",
          required: false,
          description: "Obrigatório para PERSONAL",
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "archived",
          in: "query",
          required: false,
          description: "`false` (padrão) lista os ativos; `true` os arquivados",
          schema: { type: "string", enum: ["true", "false"], default: "false" },
        },
      ],
      responses: {
        "200": {
          description: "Treinos encontrados, em ordem alfabética",
          content: {
            "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/WorkoutSummary" } } },
          },
        },
        "400": errorResponse("Filtro inválido ou `studentId` ausente (personal)", "STUDENT_ID_REQUIRED", "Informe o aluno (studentId) para listar os treinos."),
        "401": unauthorizedResponse,
        "404": errorResponse("Aluno não vinculado ao personal", "STUDENT_NOT_FOUND", "Aluno não encontrado entre os seus alunos."),
      },
    },
  },
  "/workouts/today": {
    get: {
      tags: ["Treinos"],
      summary: "Treino de hoje do aluno (STUDENT)",
      description:
        "Itens do dia da semana atual (fuso America/Sao_Paulo) dos treinos ativos do aluno. " +
        "Treinos sem itens hoje não aparecem.",
      security: bearer,
      responses: {
        "200": {
          description: "Treinos de hoje",
          content: { "application/json": { schema: { $ref: "#/components/schemas/TodayWorkouts" } } },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
      },
    },
  },
  "/workouts/{id}": {
    get: {
      tags: ["Treinos"],
      summary: "Detalha um treino, com itens agrupados por dia da semana",
      description:
        "`readOnly` é `true` para aluno com personal (inclusive nos treinos próprios) e para treino arquivado.",
      security: bearer,
      parameters: [idParam],
      responses: {
        "200": detailOk("Treino"),
        "400": errorResponse("Identificador inválido", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "404": notFound,
      },
    },
    put: {
      tags: ["Treinos"],
      summary: "Edita o treino (substitui nome e todos os itens)",
      security: bearer,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateWorkoutRequest" } } },
      },
      responses: {
        "200": detailOk("Treino atualizado"),
        "400": errorResponse("Dados inválidos ou exercício indisponível", "INVALID_EXERCISE", "Há exercícios inexistentes ou indisponíveis para você."),
        "401": unauthorizedResponse,
        "403": hasPersonal,
        "404": notFound,
        "422": errorResponse("Treino arquivado", "WORKOUT_ARCHIVED", "Treino arquivado não pode ser editado. Desarquive-o primeiro."),
      },
    },
    delete: {
      tags: ["Treinos"],
      summary: "Remove um treino sem sessões registradas",
      security: bearer,
      parameters: [idParam],
      responses: {
        "204": { description: "Treino removido" },
        "401": unauthorizedResponse,
        "403": hasPersonal,
        "404": notFound,
        "409": errorResponse(
          "Treino com sessões registradas",
          "WORKOUT_HAS_SESSIONS",
          "Este treino já tem sessões registradas e não pode ser removido. Arquive-o para escondê-lo.",
        ),
      },
    },
  },
  "/workouts/{id}/archive": {
    patch: {
      tags: ["Treinos"],
      summary: "Arquiva o treino (idempotente)",
      security: bearer,
      parameters: [idParam],
      responses: {
        "200": detailOk("Treino arquivado"),
        "401": unauthorizedResponse,
        "403": hasPersonal,
        "404": notFound,
      },
    },
  },
  "/workouts/{id}/unarchive": {
    patch: {
      tags: ["Treinos"],
      summary: "Desarquiva o treino (idempotente)",
      security: bearer,
      parameters: [idParam],
      responses: {
        "200": detailOk("Treino desarquivado"),
        "401": unauthorizedResponse,
        "403": hasPersonal,
        "404": notFound,
      },
    },
  },
};

const itemInput = {
  type: "object",
  required: ["exerciseId", "weekday", "order", "sets", "targetReps"],
  properties: {
    exerciseId: { type: "string", format: "uuid" },
    weekday: { type: "string", enum: weekdayEnum, example: "MONDAY" },
    order: { type: "integer", minimum: 1, maximum: 100, example: 1, description: "Única por dia da semana" },
    sets: { type: "integer", minimum: 1, maximum: 20, example: 4 },
    targetReps: { type: "integer", minimum: 1, maximum: 100, example: 10 },
    restSeconds: { type: "integer", minimum: 0, maximum: 3600, nullable: true, example: 60 },
    notes: { type: "string", maxLength: 300, nullable: true, example: "Pausa de 1s embaixo" },
  },
};

const itemOutput = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    order: { type: "integer" },
    exercise: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string", example: "Supino reto com barra" },
        muscleGroup: { type: "string", example: "CHEST" },
        videoEmbedUrl: { type: "string", nullable: true },
      },
    },
    sets: { type: "integer" },
    targetReps: { type: "integer" },
    restSeconds: { type: "integer", nullable: true },
    notes: { type: "string", nullable: true },
  },
};

export const workoutsSchemas = {
  CreateWorkoutRequest: {
    type: "object",
    required: ["name", "items"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Treino A" },
      studentId: { type: "string", format: "uuid", description: "Obrigatório para PERSONAL; ignorado para aluno" },
      items: { type: "array", minItems: 1, maxItems: 100, items: itemInput },
    },
  },
  UpdateWorkoutRequest: {
    type: "object",
    required: ["name", "items"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      items: { type: "array", minItems: 1, maxItems: 100, items: itemInput },
    },
  },
  WorkoutSummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Treino A" },
      studentId: { type: "string", format: "uuid" },
      authorId: { type: "string", format: "uuid" },
      archivedAt: { type: "string", format: "date-time", nullable: true },
      archived: { type: "boolean", description: "Arquivado para quem está vendo (inclui o arquivamento por regra)" },
      readOnly: { type: "boolean" },
      itemsCount: { type: "integer" },
      weekdays: { type: "array", items: { type: "string", enum: weekdayEnum } },
    },
  },
  WorkoutDetail: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      studentId: { type: "string", format: "uuid" },
      authorId: { type: "string", format: "uuid" },
      archivedAt: { type: "string", format: "date-time", nullable: true },
      archived: { type: "boolean" },
      readOnly: { type: "boolean" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            weekday: { type: "string", enum: weekdayEnum },
            items: { type: "array", items: itemOutput },
          },
        },
      },
    },
  },
  TodayWorkouts: {
    type: "object",
    properties: {
      weekday: { type: "string", enum: weekdayEnum, example: "MONDAY" },
      workouts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            items: { type: "array", items: itemOutput },
          },
        },
      },
    },
  },
};
