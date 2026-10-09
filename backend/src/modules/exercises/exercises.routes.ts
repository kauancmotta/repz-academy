import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as exercisesController from "./exercises.controller.js";
import { createExerciseSchema, updateExerciseSchema } from "./exercises.schemas.js";

// /api/exercises (personal e aluno)
export const exercisesRouter = Router();
exercisesRouter.use(authenticate);

exercisesRouter.get("/", exercisesController.listExercises);
exercisesRouter.post("/", validate({ body: createExerciseSchema }), exercisesController.createExercise);
exercisesRouter.patch("/:id", validate({ body: updateExerciseSchema }), exercisesController.updateExercise);
exercisesRouter.delete("/:id", exercisesController.deleteExercise);
