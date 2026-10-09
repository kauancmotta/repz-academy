import { randomInt } from "node:crypto";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { assertStudentOfPersonal } from "./links.access.js";

const INVITE_TTL_DAYS = 7;
const INVITE_CODE_LENGTH = 8;
// Sem caracteres ambíguos: 0, O, 1 e I.
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_CODE_ATTEMPTS = 5;

export type InviteStatus = "ACTIVE" | "USED" | "EXPIRED";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

function inviteStatus(invite: { usedAt: Date | null; expiresAt: Date }): InviteStatus {
  if (invite.usedAt) return "USED";
  if (invite.expiresAt.getTime() <= Date.now()) return "EXPIRED";
  return "ACTIVE";
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

// ---------- Convites (PERSONAL) ----------

export async function createInvite(personalId: string) {
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const invite = await prisma.invite.create({
        data: { code: generateCode(), personalId, expiresAt },
      });
      return { id: invite.id, code: invite.code, expiresAt: invite.expiresAt, status: inviteStatus(invite) };
    } catch (error) {
      // Código repetido (muito improvável): tenta outro.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  throw new AppError(500, "INVITE_CODE_GENERATION_FAILED", "Não foi possível gerar o código do convite. Tente novamente.");
}

export async function listInvites(personalId: string) {
  const invites = await prisma.invite.findMany({
    where: { personalId },
    orderBy: { createdAt: "desc" },
    include: { usedByStudent: { select: { id: true, name: true } } },
  });

  return invites.map((invite) => ({
    id: invite.id,
    code: invite.code,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt,
    usedByStudent: invite.usedByStudent,
    status: inviteStatus(invite),
  }));
}

export async function cancelInvite(personalId: string, inviteId: string) {
  const invite = await prisma.invite.findFirst({ where: { id: inviteId, personalId } });

  if (!invite) {
    throw new AppError(404, "INVITE_NOT_FOUND", "Convite não encontrado.");
  }
  if (invite.usedAt) {
    throw new AppError(422, "INVITE_ALREADY_USED", "Um convite já utilizado não pode ser cancelado.");
  }

  await prisma.invite.delete({ where: { id: invite.id } });
}

// ---------- Resgate e vínculo (STUDENT) ----------

export async function redeemInvite(studentId: string, code: string) {
  const invite = await prisma.invite.findUnique({
    where: { code },
    include: { personal: { select: { id: true, name: true } } },
  });

  if (!invite) {
    throw new AppError(404, "INVITE_NOT_FOUND", "Convite não encontrado. Confira o código.");
  }
  if (invite.usedAt) {
    throw new AppError(422, "INVITE_ALREADY_USED", "Este convite já foi utilizado.");
  }
  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new AppError(422, "INVITE_EXPIRED", "Este convite expirou. Peça um novo ao seu personal.");
  }

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { personalId: true } });
  if (!student) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado. Faça login novamente.");
  }
  if (student.personalId === invite.personalId) {
    throw new AppError(422, "ALREADY_LINKED", "Você já está vinculado a este personal.");
  }

  await prisma.$transaction(async (tx) => {
    // Update condicional: só um resgate simultâneo do mesmo código consegue (uso único).
    const claimed = await tx.invite.updateMany({
      where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date(), usedByStudentId: studentId },
    });

    if (claimed.count !== 1) {
      throw new AppError(422, "INVITE_ALREADY_USED", "Este convite já foi utilizado ou expirou.");
    }

    // Se já tinha outro personal, o vínculo anterior é encerrado ao trocar (RN-05).
    await tx.user.update({ where: { id: studentId }, data: { personalId: invite.personalId } });
  });

  return { personal: invite.personal };
}

/** Encerra o vínculo do aluno (usado pelo próprio aluno e pelo personal). */
async function unlink(studentId: string) {
  await prisma.user.update({ where: { id: studentId }, data: { personalId: null } });
}

export async function leavePersonal(studentId: string) {
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { personalId: true } });

  if (!student?.personalId) {
    throw new AppError(422, "NO_PERSONAL", "Você não está vinculado a nenhum personal.");
  }

  await unlink(studentId);
}

// ---------- Alunos (PERSONAL) ----------

export async function listStudents(personalId: string) {
  const students = await prisma.user.findMany({
    where: { personalId, role: "STUDENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  // Data da sessão finalizada mais recente de cada aluno (útil para ver quem parou de treinar).
  const lastSessions = await prisma.workoutSession.groupBy({
    by: ["studentId"],
    where: { studentId: { in: students.map((student) => student.id) }, finishedAt: { not: null } },
    _max: { finishedAt: true },
  });
  const lastByStudent = new Map(lastSessions.map((row) => [row.studentId, row._max.finishedAt]));

  return students.map((student) => ({ ...student, lastSessionAt: lastByStudent.get(student.id) ?? null }));
}

export async function removeStudent(personalId: string, studentId: string) {
  await assertStudentOfPersonal(personalId, studentId);
  await unlink(studentId);
}
