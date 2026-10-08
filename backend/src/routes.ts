import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";

// Router principal, montado em /api. Cada funcionalidade registra o seu router aqui.
export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
