import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import type { Role } from "../generated/prisma/enums.js";

/**
 * Restringe a rota a determinados perfis. Deve vir depois de `authenticate`.
 * Exemplo: router.post("/", authenticate, requireRole("PERSONAL"), controller.create);
 */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "Você não tem permissão para acessar este recurso."));
    }
    next();
  };
}
