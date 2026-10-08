import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validate } from "../../middlewares/validate.js";
import * as linksController from "./links.controller.js";
import { redeemInviteSchema } from "./links.schemas.js";

// /api/invites
export const invitesRouter = Router();
invitesRouter.use(authenticate);

invitesRouter.post("/", requireRole("PERSONAL"), linksController.createInvite);
invitesRouter.get("/", requireRole("PERSONAL"), linksController.listInvites);
invitesRouter.post("/redeem", requireRole("STUDENT"), validate({ body: redeemInviteSchema }), linksController.redeemInvite);
invitesRouter.delete("/:id", requireRole("PERSONAL"), linksController.cancelInvite);

// /api/link (vínculo do próprio aluno)
export const linkRouter = Router();
linkRouter.use(authenticate);

linkRouter.delete("/", requireRole("STUDENT"), linksController.leavePersonal);

// /api/students (alunos do personal)
export const studentsRouter = Router();
studentsRouter.use(authenticate);

studentsRouter.get("/", requireRole("PERSONAL"), linksController.listStudents);
studentsRouter.delete("/:studentId", requireRole("PERSONAL"), linksController.removeStudent);
