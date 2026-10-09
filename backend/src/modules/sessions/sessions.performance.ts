import { prisma } from "../../lib/prisma.js";

/** Série de uma sessão anterior, usada no "da última vez" (RN-14). */
export interface LastPerformance {
  sessionId: string;
  date: Date;
  sets: { setNumber: number; weightKg: number; reps: number }[];
}

/**
 * Para cada exercício, a série da sessão FINALIZADA mais recente do aluno em que ele apareceu.
 * Exercícios sem histórico não aparecem no resultado.
 */
export async function lastPerformanceByExercise(
  studentId: string,
  exerciseIds: string[],
): Promise<Map<string, LastPerformance>> {
  const result = new Map<string, LastPerformance>();
  if (exerciseIds.length === 0) return result;

  const sessionFilter = { studentId, finishedAt: { not: null } };

  // 1º: a sessão finalizada mais recente de cada exercício.
  const latest = await prisma.setLog.findMany({
    where: { exerciseId: { in: exerciseIds }, session: sessionFilter },
    orderBy: [{ session: { finishedAt: "desc" } }, { completedAt: "desc" }],
    distinct: ["exerciseId"],
    select: { exerciseId: true, sessionId: true, session: { select: { finishedAt: true } } },
  });
  if (latest.length === 0) return result;

  // 2º: todas as séries desses exercícios nessas sessões.
  const sets = await prisma.setLog.findMany({
    where: {
      OR: latest.map((entry) => ({ sessionId: entry.sessionId, exerciseId: entry.exerciseId })),
    },
    orderBy: [{ setNumber: "asc" }, { completedAt: "asc" }],
  });

  for (const entry of latest) {
    result.set(entry.exerciseId, {
      sessionId: entry.sessionId,
      date: entry.session.finishedAt!,
      sets: sets
        .filter((set) => set.sessionId === entry.sessionId && set.exerciseId === entry.exerciseId)
        .map((set) => ({ setNumber: set.setNumber, weightKg: set.weightKg.toNumber(), reps: set.reps })),
    });
  }
  return result;
}
