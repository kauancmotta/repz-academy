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
