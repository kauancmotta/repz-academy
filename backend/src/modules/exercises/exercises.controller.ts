import type { RequestHandler } from "express";
import { exerciseIdParamSchema, listExercisesQuerySchema } from "./exercises.schemas.js";
import * as exercisesService from "./exercises.service.js";

export const listExercises: RequestHandler = async (req, res) => {
  const query = listExercisesQuerySchema.parse(req.query);
  res.status(200).json(await exercisesService.listExercises(req.user!.id, query));
};

export const createExercise: RequestHandler = async (req, res) => {
  res.status(201).json(await exercisesService.createExercise(req.user!.id, req.body));
};

export const updateExercise: RequestHandler = async (req, res) => {
  const { id } = exerciseIdParamSchema.parse(req.params);
  res.status(200).json(await exercisesService.updateExercise(req.user!.id, id, req.body));
};

export const deleteExercise: RequestHandler = async (req, res) => {
  const { id } = exerciseIdParamSchema.parse(req.params);
  await exercisesService.deleteExercise(req.user!.id, id);
  res.status(204).send();
};
