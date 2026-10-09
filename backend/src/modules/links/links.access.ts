import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

/**
 * RN-18: o personal só acessa dados de alunos atualmente vinculados a ele.
 * Lança 404 (sem revelar se o aluno existe) e devolve o aluno quando o vínculo é válido.
 *
 * Reutilizado por treinos, execução e evolução. Exemplo:
 *   await assertStudentOfPersonal(req.user!.id, studentId);
 */
export async function assertStudentOfPersonal(personalId: string, studentId: string) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", personalId },
    select: { id: true, name: true, email: true },
  });

  if (!student) {
    throw new AppError(404, "STUDENT_NOT_FOUND", "Aluno não encontrado entre os seus alunos.");
  }

  return student;
}

/**
 * Resolve de quem são os dados consultados (sessões, evolução, "da última vez").
 * Aluno: sempre os próprios (o parâmetro é ignorado). Personal: `studentId` é obrigatório e
 * o aluno precisa estar vinculado a ele (RN-18, 404 caso contrário).
 */
export async function resolveTargetStudent(
  actor: { id: string; role: "PERSONAL" | "STUDENT" },
  studentIdParam?: string,
): Promise<string> {
  if (actor.role === "STUDENT") return actor.id;

  if (!studentIdParam) {
    throw new AppError(400, "STUDENT_ID_REQUIRED", "Informe o aluno (studentId).");
  }
  await assertStudentOfPersonal(actor.id, studentIdParam);
  return studentIdParam;
}
