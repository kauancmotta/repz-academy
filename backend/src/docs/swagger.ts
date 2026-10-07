/**
 * Especificação OpenAPI 3 da API do Repz, exibida em /api/docs.
 * Cada funcionalidade acrescenta as suas rotas em "paths" e os seus modelos em "components.schemas".
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Repz API",
    version: "0.1.0",
    description:
      "API do Repz, aplicativo de acompanhamento de treinos de academia. " +
      "Rotas protegidas usam JWT no header `Authorization: Bearer <token>`.",
  },
  servers: [{ url: "/api", description: "API do Repz" }],
  tags: [{ name: "Saúde", description: "Verificação de funcionamento da API" }],
  paths: {
    "/health": {
      get: {
        tags: ["Saúde"],
        summary: "Verifica a API e a conexão com o banco",
        responses: {
          "200": {
            description: "API e banco funcionando",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Health" },
                example: { status: "ok", database: "up" },
              },
            },
          },
          "503": {
            description: "API no ar, mas o banco não respondeu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Health" },
                example: { status: "error", database: "down" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Health: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "error"] },
          database: { type: "string", enum: ["up", "down"] },
        },
        required: ["status", "database"],
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Dados inválidos." },
              details: {
                description: "Informações adicionais (por exemplo, campos inválidos). Opcional.",
              },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
    },
  },
} as const;
