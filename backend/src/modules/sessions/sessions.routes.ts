import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validate } from "../../middlewares/validate.js";
import * as sessionsController from "./sessions.controller.js";
import { logSetSchema, startSessionSchema, updateSetSchema } from "./sessions.schemas.js";

// /api/sessions (somente aluno)
export const sessionsRouter = Router();
sessionsRouter.use(authenticate, requireRole("STUDENT"));

sessionsRouter.post("/", validate({ body: startSessionSchema }), sessionsController.startSession);
sessionsRouter.get("/current", sessionsController.getCurrentSession);
sessionsRouter.post("/:id/sets", validate({ body: logSetSchema }), sessionsController.logSet);
sessionsRouter.patch("/:id/sets/:setId", validate({ body: updateSetSchema }), sessionsController.updateSet);
sessionsRouter.delete("/:id/sets/:setId", sessionsController.deleteSet);
sessionsRouter.post("/:id/finish", sessionsController.finishSession);
sessionsRouter.delete("/:id", sessionsController.cancelSession);

// /api/exercises/:id/last-performance (aluno e personal). Montado em /exercises, junto do router da 003.
export const exercisePerformanceRouter = Router();
exercisePerformanceRouter.use(authenticate);
exercisePerformanceRouter.get("/:id/last-performance", sessionsController.getLastPerformance);
