import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { Role } from "../generated/prisma/enums.js";

const unauthorized = () =>
  new AppError(401, "UNAUTHORIZED", "Token não informado ou inválido. Faça login novamente.");

/**
 * Exige um JWT válido no header `Authorization: Bearer <token>`
 * e preenche `req.user` com `{ id, role }`.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(unauthorized());
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !Object.values(Role).includes(payload.role as Role)
    ) {
      return next(unauthorized());
    }

    req.user = { id: payload.sub, role: payload.role as Role };
    next();
  } catch {
    next(unauthorized());
  }
};
