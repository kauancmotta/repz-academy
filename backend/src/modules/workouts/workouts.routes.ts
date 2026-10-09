import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validate } from "../../middlewares/validate.js";
import * as workoutsController from "./workouts.controller.js";
import { createWorkoutSchema, updateWorkoutSchema } from "./workouts.schemas.js";

// /api/workouts (personal e aluno; as regras finas ficam no serviço)
export const workoutsRouter = Router();
workoutsRouter.use(authenticate);

workoutsRouter.post("/", validate({ body: createWorkoutSchema }), workoutsController.createWorkout);
workoutsRouter.get("/", workoutsController.listWorkouts);
// "/today" precisa vir antes de "/:id", senão "today" seria lido como identificador.
workoutsRouter.get("/today", requireRole("STUDENT"), workoutsController.getTodayWorkouts);
workoutsRouter.get("/:id", workoutsController.getWorkout);
workoutsRouter.put("/:id", validate({ body: updateWorkoutSchema }), workoutsController.updateWorkout);
workoutsRouter.patch("/:id/archive", workoutsController.archiveWorkout);
workoutsRouter.patch("/:id/unarchive", workoutsController.unarchiveWorkout);
workoutsRouter.delete("/:id", workoutsController.deleteWorkout);
