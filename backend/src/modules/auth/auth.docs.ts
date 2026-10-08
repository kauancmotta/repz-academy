/** Documentação OpenAPI das rotas de autenticação (usada em src/docs/swagger.ts). */

const errorResponse = (description: string, code: string, message: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { error: { code, message } },
    },
  },
});

export const authTag = { name: "Autenticação", description: "Cadastro, login e dados do usuário logado" };

export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Autenticação"],
      summary: "Cadastra um usuário (personal ou aluno)",
      description:
        "O perfil (`role`) é escolhido no cadastro e não pode ser alterado depois. " +
        "O e-mail é único e não diferencia maiúsculas de minúsculas.",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
      },
      responses: {
        "201": {
          description: "Usuário criado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
        },
        "400": errorResponse("Dados inválidos", "VALIDATION_ERROR", "Dados inválidos."),
        "409": errorResponse("E-mail já cadastrado", "EMAIL_ALREADY_USED", "Este e-mail já está cadastrado."),
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Autenticação"],
      summary: "Entra com e-mail e senha",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
      },
      responses: {
        "200": {
          description: "Login realizado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
        },
        "400": errorResponse("Dados inválidos", "VALIDATION_ERROR", "Dados inválidos."),
        "401": errorResponse("Credenciais inválidas", "INVALID_CREDENTIALS", "E-mail ou senha inválidos."),
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Autenticação"],
      summary: "Retorna o usuário autenticado",
      description: "Para alunos, inclui o personal vinculado (ou `null`).",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Usuário autenticado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Me" } } },
        },
        "401": errorResponse("Não autenticado", "UNAUTHORIZED", "Token não informado ou inválido. Faça login novamente."),
      },
    },
  },
};

export const authSchemas = {
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password", "role"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Maria Silva" },
      email: { type: "string", format: "email", example: "maria@email.com" },
      password: { type: "string", minLength: 8, maxLength: 72, example: "senha12345" },
      role: { type: "string", enum: ["PERSONAL", "STUDENT"], example: "STUDENT" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "maria@email.com" },
      password: { type: "string", example: "senha12345" },
    },
  },
  UserPublic: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Maria Silva" },
      email: { type: "string", format: "email", example: "maria@email.com" },
      role: { type: "string", enum: ["PERSONAL", "STUDENT"] },
    },
    required: ["id", "name", "email", "role"],
  },
  AuthResponse: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/UserPublic" },
      token: { type: "string", description: "JWT para o header Authorization: Bearer" },
    },
    required: ["user", "token"],
  },
  Me: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["PERSONAL", "STUDENT"] },
      personal: {
        nullable: true,
        type: "object",
        description: "Personal vinculado ao aluno (nulo se não houver)",
        properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
      },
    },
    required: ["id", "name", "email", "role", "personal"],
  },
};
