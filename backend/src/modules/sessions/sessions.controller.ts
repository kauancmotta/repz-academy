import type { RequestHandler } from "express";
import {
  exerciseIdParamSchema,
  lastPerformanceQuerySchema,
  sessionIdParamSchema,
  setParamsSchema,
} from "./sessions.schemas.js";
import * as sessionsService from "./sessions.service.js";

export const startSession: RequestHandler = async (req, res) => {
  res.status(201).json(await sessionsService.startSession(req.user!.id, req.body));
};

export const getCurrentSession: RequestHandler = async (req, res) => {
  res.status(200).json(await sessionsService.getCurrentSession(req.user!.id));
};

export const logSet: RequestHandler = async (req, res) => {
  const { id } = sessionIdParamSchema.parse(req.params);
  res.status(201).json(await sessionsService.logSet(req.user!.id, id, req.body));
};

export const updateSet: RequestHandler = async (req, res) => {
  const { id, setId } = setParamsSchema.parse(req.params);
  res.status(200).json(await sessionsService.updateSet(req.user!.id, id, setId, req.body));
};

export const deleteSet: RequestHandler = async (req, res) => {
  const { id, setId } = setParamsSchema.parse(req.params);
  await sessionsService.deleteSet(req.user!.id, id, setId);
  res.status(204).send();
};

export const finishSession: RequestHandler = async (req, res) => {
  const { id } = sessionIdParamSchema.parse(req.params);
  res.status(200).json(await sessionsService.finishSession(req.user!.id, id));
};

export const cancelSession: RequestHandler = async (req, res) => {
  const { id } = sessionIdParamSchema.parse(req.params);
  await sessionsService.cancelSession(req.user!.id, id);
  res.status(204).send();
};

export const getLastPerformance: RequestHandler = async (req, res) => {
  const { id } = exerciseIdParamSchema.parse(req.params);
  const { studentId } = lastPerformanceQuerySchema.parse(req.query);
  res.status(200).json(await sessionsService.getLastPerformance(req.user!, id, studentId));
};
