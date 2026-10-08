import { errorResponse, forbiddenResponse, unauthorizedResponse } from "../../docs/helpers.js";

/** Documentação OpenAPI das rotas de vínculo (usada em src/docs/swagger.ts). */

export const linksTag = {
  name: "Vínculo",
  description: "Convites, vínculo entre aluno e personal e lista de alunos",
};

const bearer = [{ bearerAuth: [] }];

const uuidParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});

export const linksPaths = {
  "/invites": {
    post: {
      tags: ["Vínculo"],
      summary: "Gera um convite de vínculo (PERSONAL)",
      description: "Código de 8 caracteres, uso único, válido por 7 dias.",
      security: bearer,
      responses: {
        "201": {
          description: "Convite criado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/InviteCreated" } } },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
      },
    },
    get: {
      tags: ["Vínculo"],
      summary: "Lista os convites do personal (PERSONAL)",
      description: "Status: `ACTIVE`, `USED` ou `EXPIRED`. Do mais novo para o mais antigo.",
      security: bearer,
      responses: {
        "200": {
          description: "Convites do personal",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/Invite" } },
            },
          },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
      },
    },
  },
  "/invites/redeem": {
    post: {
      tags: ["Vínculo"],
      summary: "Resgata um convite e vincula o aluno ao personal (STUDENT)",
      description:
        "Se o aluno já tinha outro personal, o vínculo anterior é encerrado (troca de personal). " +
        "O código aceita minúsculas e espaços ao redor.",
      security: bearer,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/RedeemInviteRequest" } } },
      },
      responses: {
        "200": {
          description: "Aluno vinculado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/RedeemInviteResponse" } } },
        },
        "400": errorResponse("Dados inválidos", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "404": errorResponse("Código inexistente", "INVITE_NOT_FOUND", "Convite não encontrado. Confira o código."),
        "422": errorResponse(
          "Convite usado, expirado ou aluno já vinculado a este personal",
          "INVITE_EXPIRED",
          "Este convite expirou. Peça um novo ao seu personal.",
        ),
      },
    },
  },
  "/invites/{id}": {
    delete: {
      tags: ["Vínculo"],
      summary: "Cancela um convite ainda não utilizado (PERSONAL)",
      security: bearer,
      parameters: [uuidParam("id", "Identificador do convite")],
      responses: {
        "204": { description: "Convite cancelado" },
        "400": errorResponse("Identificador inválido", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
        "404": errorResponse("Convite não encontrado (ou de outro personal)", "INVITE_NOT_FOUND", "Convite não encontrado."),
        "422": errorResponse(
          "Convite já utilizado",
          "INVITE_ALREADY_USED",
          "Um convite já utilizado não pode ser cancelado.",
        ),
      },
    },
  },
  "/link": {
    delete: {
      tags: ["Vínculo"],
      summary: "Aluno encerra o próprio vínculo com o personal (STUDENT)",
      security: bearer,
      responses: {
        "204": { description: "Vínculo encerrado" },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("STUDENT"),
        "422": errorResponse("Aluno sem personal", "NO_PERSONAL", "Você não está vinculado a nenhum personal."),
      },
    },
  },
  "/students": {
    get: {
      tags: ["Vínculo"],
      summary: "Lista os alunos vinculados ao personal (PERSONAL)",
      description: "`lastSessionAt` é `null` até a funcionalidade de execução de treino (005).",
      security: bearer,
      responses: {
        "200": {
          description: "Alunos do personal, em ordem alfabética",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/Student" } },
            },
          },
        },
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
      },
    },
  },
  "/students/{studentId}": {
    delete: {
      tags: ["Vínculo"],
      summary: "Personal remove um aluno do seu vínculo (PERSONAL)",
      description: "O histórico do aluno é mantido; o personal deixa de ter acesso a ele.",
      security: bearer,
      parameters: [uuidParam("studentId", "Identificador do aluno")],
      responses: {
        "204": { description: "Aluno removido do vínculo" },
        "400": errorResponse("Identificador inválido", "VALIDATION_ERROR", "Dados inválidos."),
        "401": unauthorizedResponse,
        "403": forbiddenResponse("PERSONAL"),
        "404": errorResponse(
          "Aluno inexistente ou não vinculado a este personal",
          "STUDENT_NOT_FOUND",
          "Aluno não encontrado entre os seus alunos.",
        ),
      },
    },
  },
};

export const linksSchemas = {
  InviteCreated: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      code: { type: "string", example: "K7M2QX9A" },
      expiresAt: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["ACTIVE", "USED", "EXPIRED"], example: "ACTIVE" },
    },
    required: ["id", "code", "expiresAt", "status"],
  },
  Invite: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      code: { type: "string", example: "K7M2QX9A" },
      expiresAt: { type: "string", format: "date-time" },
      usedAt: { type: "string", format: "date-time", nullable: true },
      usedByStudent: {
        type: "object",
        nullable: true,
        properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
      },
      status: { type: "string", enum: ["ACTIVE", "USED", "EXPIRED"] },
    },
    required: ["id", "code", "expiresAt", "usedAt", "usedByStudent", "status"],
  },
  RedeemInviteRequest: {
    type: "object",
    required: ["code"],
    properties: { code: { type: "string", example: "K7M2QX9A" } },
  },
  RedeemInviteResponse: {
    type: "object",
    properties: {
      personal: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, name: { type: "string", example: "Carlos Personal" } },
      },
    },
    required: ["personal"],
  },
  Student: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Maria Silva" },
      email: { type: "string", format: "email", example: "maria@email.com" },
      lastSessionAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "name", "email", "lastSessionAt"],
  },
};
