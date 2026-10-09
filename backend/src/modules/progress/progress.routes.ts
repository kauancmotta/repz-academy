import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import * as progressController from "./progress.controller.js";

// /api/progress (aluno vê o próprio; personal informa studentId de aluno vinculado)
export const progressRouter = Router();
progressRouter.use(authenticate);

progressRouter.get("/exercises", progressController.listExercisesProgress);
progressRouter.get("/exercises/:exerciseId", progressController.getExerciseProgress);
progressRouter.get("/frequency", progressController.getFrequency);
progressRouter.get("/sessions", progressController.listSessions);
progressRouter.get("/sessions/:id", progressController.getSessionDetail);

// /api/students/:studentId/overview (somente personal). Montado em /students, junto do router da 002.
export const studentOverviewRouter = Router();
studentOverviewRouter.use(authenticate);
studentOverviewRouter.get("/:studentId/overview", requireRole("PERSONAL"), progressController.getStudentOverview);
