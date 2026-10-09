import type { RequestHandler } from "express";
import {
  exerciseParamSchema,
  frequencyQuerySchema,
  overviewParamSchema,
  sessionParamSchema,
  sessionsQuerySchema,
  studentQuerySchema,
} from "./progress.schemas.js";
import * as progressService from "./progress.service.js";

export const listExercisesProgress: RequestHandler = async (req, res) => {
  const { studentId } = studentQuerySchema.parse(req.query);
  res.status(200).json(await progressService.listExercisesProgress(req.user!, studentId));
};

export const getExerciseProgress: RequestHandler = async (req, res) => {
  const { exerciseId } = exerciseParamSchema.parse(req.params);
  const { studentId } = studentQuerySchema.parse(req.query);
  res.status(200).json(await progressService.getExerciseProgress(req.user!, exerciseId, studentId));
};

export const getFrequency: RequestHandler = async (req, res) => {
  const { studentId, weeks } = frequencyQuerySchema.parse(req.query);
  res.status(200).json(await progressService.getFrequency(req.user!, weeks, studentId));
};

export const listSessions: RequestHandler = async (req, res) => {
  const { studentId, limit, offset } = sessionsQuerySchema.parse(req.query);
  res.status(200).json(await progressService.listSessions(req.user!, { limit, offset }, studentId));
};

export const getSessionDetail: RequestHandler = async (req, res) => {
  const { id } = sessionParamSchema.parse(req.params);
  const { studentId } = studentQuerySchema.parse(req.query);
  res.status(200).json(await progressService.getSessionDetail(req.user!, id, studentId));
};

export const getStudentOverview: RequestHandler = async (req, res) => {
  const { studentId } = overviewParamSchema.parse(req.params);
  res.status(200).json(await progressService.getStudentOverview(req.user!.id, studentId));
};
