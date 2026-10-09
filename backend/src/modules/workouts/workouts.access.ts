import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Regras de visibilidade e permissão de treinos (RN-06, RN-07, RN-08, RN-09, RN-18).
 * Detalhes em docs/arquitetura.md, seção 5. Nada aqui grava dados: tudo é calculado.
 */

export interface StudentContext {
  id: string;
  /** Personal atual do aluno (RN-03); nulo quando o aluno não tem personal. */
  personalId: string | null;
}

export async function loadStudentContext(studentId: string): Promise<StudentContext> {
  return prisma.user.findUniqueOrThrow({ where: { id: studentId }, select: { id: true, personalId: true } });
}

/**
 * Treinos que o aluno enxerga: os do personal atual e os próprios.
 * Treinos de ex-personals não aparecem (RN-06).
 */
export function visibleToStudent(student: StudentContext): Prisma.WorkoutWhereInput {
  return {
    studentId: student.id,
    authorId: { in: student.personalId ? [student.personalId, student.id] : [student.id] },
  };
}

/** Treinos que o personal enxerga: os que ele criou para alunos atualmente vinculados a ele (RN-18). */
export function visibleToPersonal(personalId: string): Prisma.WorkoutWhereInput {
  return { authorId: personalId, student: { personalId } };
}

interface WorkoutAccessFields {
  authorId: string;
  archivedAt: Date | null;
}

/**
 * Arquivado para o aluno: arquivamento manual OU treino próprio enquanto o aluno tem personal (RN-09).
 */
export function isArchivedForStudent(student: StudentContext, workout: WorkoutAccessFields): boolean {
  return workout.archivedAt !== null || (student.personalId !== null && workout.authorId === student.id);
}

/** Aluno com personal nunca edita (RN-07); treino arquivado também fica somente leitura. */
export function isReadOnlyForStudent(student: StudentContext, workout: WorkoutAccessFields): boolean {
  return student.personalId !== null || workout.archivedAt !== null;
}

/** RN-07: aluno com personal não cria, edita, arquiva nem remove treinos. */
export function assertStudentCanManage(student: StudentContext): void {
  if (student.personalId !== null) {
    throw new AppError(
      403,
      "STUDENT_HAS_PERSONAL",
      "Você tem um personal vinculado e não pode criar nem alterar treinos. Peça ao seu personal.",
    );
  }
}
