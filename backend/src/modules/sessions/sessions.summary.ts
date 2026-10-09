import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { volumeKg } from "./sessions.math.js";

/**
 * Resumo de uma sessão finalizada: volume (RN-16) e recordes pessoais (RN-15).
 * Reutilizável pela funcionalidade de evolução (006).
 *
 * PR: para cada exercício, a maior carga da sessão supera a maior carga registrada em sessões
 * finalizadas ANTES desta. Sem histórico anterior do exercício, não há PR.
 */
export async function buildSessionSummary(studentId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, studentId },
    include: { workout: { select: { name: true } }, sets: { include: { exercise: true } } },
  });
  if (!session || !session.finishedAt) {
    throw new AppError(404, "SESSION_NOT_FOUND", "Sessão não encontrada.");
  }

  const exerciseIds = [...new Set(session.sets.map((set) => set.exerciseId))];

  const previousBest = await prisma.setLog.groupBy({
    by: ["exerciseId"],
    where: {
      exerciseId: { in: exerciseIds },
      session: { studentId, finishedAt: { not: null, lt: session.finishedAt } },
    },
    _max: { weightKg: true },
  });
  const previousBestByExercise = new Map(
    previousBest.map((row) => [row.exerciseId, row._max.weightKg?.toNumber() ?? null]),
  );

  const exercises = exerciseIds.map((exerciseId) => {
    const sets = session.sets
      .filter((set) => set.exerciseId === exerciseId)
      .map((set) => ({ weightKg: set.weightKg.toNumber(), reps: set.reps }));
    const maxWeightKg = Math.max(...sets.map((set) => set.weightKg));
    const repsAtMax = Math.max(...sets.filter((set) => set.weightKg === maxWeightKg).map((set) => set.reps));
    return {
      exerciseId,
      exerciseName: session.sets.find((set) => set.exerciseId === exerciseId)!.exercise.name,
      setsCount: sets.length,
      volumeKg: volumeKg(sets),
      maxWeightKg,
      repsAtMaxWeight: repsAtMax,
      previousBestKg: previousBestByExercise.get(exerciseId) ?? null,
    };
  });

  const personalRecords = exercises
    .filter((exercise) => exercise.previousBestKg !== null && exercise.maxWeightKg > exercise.previousBestKg)
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      weightKg: exercise.maxWeightKg,
      reps: exercise.repsAtMaxWeight,
      previousBestKg: exercise.previousBestKg,
    }));

  return {
    id: session.id,
    workoutId: session.workoutId,
    workoutName: session.workout.name,
    weekday: session.weekday,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    durationSeconds: Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 1000),
    totalVolumeKg: volumeKg(session.sets.map((set) => ({ weightKg: set.weightKg.toNumber(), reps: set.reps }))),
    setsCount: session.sets.length,
    exercises: exercises.map(({ repsAtMaxWeight: _ignored, ...rest }) => rest),
    personalRecords,
  };
}
