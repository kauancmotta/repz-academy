import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { exercisesRouter } from "./modules/exercises/exercises.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { invitesRouter, linkRouter, studentsRouter } from "./modules/links/links.routes.js";
import { progressRouter, studentOverviewRouter } from "./modules/progress/progress.routes.js";
import { exercisePerformanceRouter, sessionsRouter } from "./modules/sessions/sessions.routes.js";
import { workoutsRouter } from "./modules/workouts/workouts.routes.js";

// Router principal, montado em /api. Cada funcionalidade registra o seu router aqui.
export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/invites", invitesRouter);
router.use("/link", linkRouter);
router.use("/students", studentsRouter);
router.use("/exercises", exercisesRouter);
router.use("/workouts", workoutsRouter);
router.use("/sessions", sessionsRouter);
router.use("/exercises", exercisePerformanceRouter);
router.use("/progress", progressRouter);
router.use("/students", studentOverviewRouter);
