import type { RequestHandler } from "express";
import { listWorkoutsQuerySchema, workoutIdParamSchema } from "./workouts.schemas.js";
import * as workoutsService from "./workouts.service.js";

export const createWorkout: RequestHandler = async (req, res) => {
  res.status(201).json(await workoutsService.createWorkout(req.user!, req.body));
};

export const listWorkouts: RequestHandler = async (req, res) => {
  const query = listWorkoutsQuerySchema.parse(req.query);
  res.status(200).json(await workoutsService.listWorkouts(req.user!, query));
};

export const getTodayWorkouts: RequestHandler = async (req, res) => {
  res.status(200).json(await workoutsService.getTodayWorkouts(req.user!));
};

export const getWorkout: RequestHandler = async (req, res) => {
  const { id } = workoutIdParamSchema.parse(req.params);
  res.status(200).json(await workoutsService.getWorkout(req.user!, id));
};

export const updateWorkout: RequestHandler = async (req, res) => {
  const { id } = workoutIdParamSchema.parse(req.params);
  res.status(200).json(await workoutsService.updateWorkout(req.user!, id, req.body));
};

export const archiveWorkout: RequestHandler = async (req, res) => {
  const { id } = workoutIdParamSchema.parse(req.params);
  res.status(200).json(await workoutsService.archiveWorkout(req.user!, id));
};

export const unarchiveWorkout: RequestHandler = async (req, res) => {
  const { id } = workoutIdParamSchema.parse(req.params);
  res.status(200).json(await workoutsService.unarchiveWorkout(req.user!, id));
};

export const deleteWorkout: RequestHandler = async (req, res) => {
  const { id } = workoutIdParamSchema.parse(req.params);
  await workoutsService.deleteWorkout(req.user!, id);
  res.status(204).send();
};
