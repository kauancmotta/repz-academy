/** Auxiliares compartilhados pelos arquivos *.docs.ts de cada módulo. */

export const errorResponse = (description: string, code: string, message: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { error: { code, message } },
    },
  },
});

export const unauthorizedResponse = errorResponse(
  "Não autenticado",
  "UNAUTHORIZED",
  "Token não informado ou inválido. Faça login novamente.",
);

export const forbiddenResponse = (who: "PERSONAL" | "STUDENT") =>
  errorResponse(
    `Rota exclusiva do perfil ${who}`,
    "FORBIDDEN",
    "Você não tem permissão para acessar este recurso.",
  );
