import type { RequestHandler } from "express";
import * as authService from "./auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
};

export const me: RequestHandler = async (req, res) => {
  // `authenticate` garante que req.user existe.
  const user = await authService.getMe(req.user!.id);
  res.status(200).json(user);
};
