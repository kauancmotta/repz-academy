import { errorResponse, unauthorizedResponse } from "../../docs/helpers.js";

/** Documentação OpenAPI das rotas de exercícios (usada em src/docs/swagger.ts). */

export const exercisesTag = {
  name: "Exercícios",
  description: "Catálogo de exercícios (globais e do próprio usuário) com vídeo opcional do YouTube",
};

const bearer = [{ bearerAuth: [] }];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador do exercício",
  schema: { type: "string", format: "uuid" },
};

const muscleGroupEnum = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS", "GLUTES", "CORE", "CARDIO", "OTHER"];

const notOwnerResponse = errorResponse(
  "Exercício global ou de outro usuário",
  "FORBIDDEN",
  "Você só pode alterar exercícios criados por você.",
);
const notFoundResponse = errorResponse("Exercício inexistente", "EXERCISE_NOT_FOUND", "Exercício não encontrado.");

export const exercisesPaths = {
  "/exercises": {
    get: {
      tags: ["Exercícios"],
      summary: "Lista os exercícios globais e os criados pelo usuário",
      description:
        "A busca (`search`) ignora acentos e maiúsculas. Exercícios de outros usuários nunca aparecem. " +
        "Ordem alfabética.",
      security: bearer,
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          description: "Trecho do nome do exercício",
          schema: { type: "string", example: "supino" },
        },
        {
          name: "muscleGroup",
          in: "query",
          required: false,
          description: "Filtra por grupo muscular",
          schema: { type: "string", enum: muscleGroupEnum },
        },
      ],
      responses: {
        "200": {
          description: "Exercícios encontrados",
          content: {
            "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Exercise" } } },
          },
        },
        "400": errorResponse("Filtro inválido", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
      },
    },
    post: {
      tags: ["Exercícios"],
      summary: "Cria um exercício próprio",
      security: bearer,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CreateExerciseRequest" } } },
      },
      responses: {
        "201": {
          description: "Exercício criado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Exercise" } } },
        },
        "400": errorResponse("Dados inválidos ou link que não é do YouTube", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "409": errorResponse(
          "Nome já usado por você",
          "EXERCISE_ALREADY_EXISTS",
          "Você já tem um exercício com esse nome.",
        ),
      },
    },
  },
  "/exercises/{id}": {
    patch: {
      tags: ["Exercícios"],
      summary: "Edita um exercício próprio",
      description:
        "Envie apenas os campos a alterar. `description` e `videoUrl` aceitam `null` (ou texto vazio) para limpar o campo.",
      security: bearer,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateExerciseRequest" } } },
      },
      responses: {
        "200": {
          description: "Exercício atualizado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Exercise" } } },
        },
        "400": errorResponse("Dados inválidos", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "403": notOwnerResponse,
        "404": notFoundResponse,
        "409": errorResponse(
          "Nome já usado por você",
          "EXERCISE_ALREADY_EXISTS",
          "Você já tem um exercício com esse nome.",
        ),
      },
    },
    delete: {
      tags: ["Exercícios"],
      summary: "Remove um exercício próprio",
      security: bearer,
      parameters: [idParam],
      responses: {
        "204": { description: "Exercício removido" },
        "400": errorResponse("Identificador inválido", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "403": notOwnerResponse,
        "404": notFoundResponse,
        "409": errorResponse(
          "Exercício em uso em treino ou sessão",
          "EXERCISE_IN_USE",
          "Este exercício está em uso em treinos ou sessões e não pode ser removido.",
        ),
      },
    },
  },
};

export const exercisesSchemas = {
  Exercise: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Supino reto com barra" },
      muscleGroup: { type: "string", enum: muscleGroupEnum, example: "CHEST" },
      description: { type: "string", nullable: true },
      videoUrl: { type: "string", nullable: true, example: "https://youtu.be/dQw4w9WgXcQ" },
      videoEmbedUrl: {
        type: "string",
        nullable: true,
        description: "URL para usar no iframe",
        example: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      isGlobal: { type: "boolean", description: "true para exercícios do catálogo (somente leitura)" },
    },
    required: ["id", "name", "muscleGroup", "description", "videoUrl", "videoEmbedUrl", "isGlobal"],
  },
  CreateExerciseRequest: {
    type: "object",
    required: ["name", "muscleGroup"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Remada cavalinho" },
      muscleGroup: { type: "string", enum: muscleGroupEnum, example: "BACK" },
      description: { type: "string", maxLength: 1000, nullable: true },
      videoUrl: {
        type: "string",
        nullable: true,
        description: "Formatos: youtube.com/watch?v=, youtu.be/ ou youtube.com/embed/",
        example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    },
  },
  UpdateExerciseRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      muscleGroup: { type: "string", enum: muscleGroupEnum },
      description: { type: "string", maxLength: 1000, nullable: true },
      videoUrl: { type: "string", nullable: true },
    },
  },
};
