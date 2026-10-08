import type { RequestHandler } from "express";
import { idParamSchema, studentIdParamSchema } from "./links.schemas.js";
import * as linksService from "./links.service.js";

export const createInvite: RequestHandler = async (req, res) => {
  const invite = await linksService.createInvite(req.user!.id);
  res.status(201).json(invite);
};

export const listInvites: RequestHandler = async (req, res) => {
  res.status(200).json(await linksService.listInvites(req.user!.id));
};

export const cancelInvite: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await linksService.cancelInvite(req.user!.id, id);
  res.status(204).send();
};

export const redeemInvite: RequestHandler = async (req, res) => {
  const result = await linksService.redeemInvite(req.user!.id, req.body.code);
  res.status(200).json(result);
};

export const leavePersonal: RequestHandler = async (req, res) => {
  await linksService.leavePersonal(req.user!.id);
  res.status(204).send();
};

export const listStudents: RequestHandler = async (req, res) => {
  res.status(200).json(await linksService.listStudents(req.user!.id));
};

export const removeStudent: RequestHandler = async (req, res) => {
  const { studentId } = studentIdParamSchema.parse(req.params);
  await linksService.removeStudent(req.user!.id, studentId);
  res.status(204).send();
};
