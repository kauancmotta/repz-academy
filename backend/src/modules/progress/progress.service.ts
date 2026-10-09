import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { assertStudentOfPersonal, resolveTargetStudent } from "../links/links.access.js";
import { buildSessionSummary } from "../sessions/sessions.summary.js";
import {
  bestPoint,
  buildExercisePoints,
  frequencyWindowStart,
  lastChange,
  volumeKg,
  weeklyFrequency,
  type SessionSets,
} from "./calculations.js";

interface Actor {
  id: string;
  role: "PERSONAL" | "STUDENT";
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface ExerciseHistory {
  exercise: { id: string; name: string; muscleGroup: string };
  sessions: SessionSets[];
}

/**
 * Séries de sessões FINALIZADAS do aluno, agrupadas por exercício e sessão.
 * Uma única consulta; as agregações são feitas em memória com as funções puras de calculations.ts
 * (conferíveis à mão), em vez de groupBy/SQL cru. O volume de dados por aluno é pequeno.
 */
async function loadHistory(studentId: string, exerciseId?: string): Promise<Map<string, ExerciseHistory>> {
  const rows = await prisma.setLog.findMany({
    where: {
      ...(exerciseId ? { exerciseId } : {}),
      session: { studentId, finishedAt: { not: null } },
    },
    select: {
      exerciseId: true,
      sessionId: true,
      weightKg: true,
      reps: true,
      exercise: { select: { id: true, name: true, muscleGroup: true } },
      session: { select: { finishedAt: true } },
    },
  });

  const byExercise = new Map<string, { exercise: ExerciseHistory["exercise"]; sessions: Map<string, SessionSets> }>();
  for (const row of rows) {
    let entry = byExercise.get(row.exerciseId);
    if (!entry) {
      entry = { exercise: row.exercise, sessions: new Map() };
      byExercise.set(row.exerciseId, entry);
    }
    let session = entry.sessions.get(row.sessionId);
    if (!session) {
      session = { sessionId: row.sessionId, finishedAt: row.session.finishedAt!, sets: [] };
      entry.sessions.set(row.sessionId, session);
    }
    session.sets.push({ weightKg: row.weightKg.toNumber(), reps: row.reps });
  }

  return new Map(
    [...byExercise].map(([id, entry]) => [id, { exercise: entry.exercise, sessions: [...entry.sessions.values()] }]),
  );
}

/** Lista de exercícios com histórico e variação da última sessão (RF-02). */
export async function listExercisesProgress(actor: Actor, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);
  const history = await loadHistory(studentId);

  return [...history.values()]
    .map(({ exercise, sessions }) => {
      const points = buildExercisePoints(sessions);
      const last = points[points.length - 1]!;
      return {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sessionsCount: points.length,
        lastMaxWeightKg: last.maxWeightKg,
        ...lastChange(points),
        lastSessionAt: last.date,
      };
    })
    .sort((a, b) => b.lastSessionAt.getTime() - a.lastSessionAt.getTime());
}

/** Série temporal de um exercício, com PRs marcados (RF-01). */
export async function getExerciseProgress(actor: Actor, exerciseId: string, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, name: true, muscleGroup: true },
  });
  if (!exercise) throw new AppError(404, "EXERCISE_NOT_FOUND", "Exercício não encontrado.");

  const history = await loadHistory(studentId, exerciseId);
  const points = buildExercisePoints(history.get(exerciseId)?.sessions ?? []);
  const best = bestPoint(points);

  return {
    exercise,
    points: points.map((point) => ({
      sessionId: point.sessionId,
      date: point.date,
      maxWeightKg: point.maxWeightKg,
      repsAtMax: point.repsAtMax,
      volumeKg: point.volumeKg,
      setsCount: point.setsCount,
      isPersonalRecord: point.isPersonalRecord,
    })),
    personalRecord: best
      ? { weightKg: best.maxWeightKg, reps: best.repsAtMax, date: best.date, sessionId: best.sessionId }
      : null,
    ...lastChange(points),
  };
}

/** Sessões finalizadas por semana (RN-17), da semana mais antiga para a atual (RF-04). */
export async function getFrequency(actor: Actor, weeks: number, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);
  return frequencyForStudent(studentId, weeks);
}

async function frequencyForStudent(studentId: string, weeks: number) {
  const sessions = await prisma.workoutSession.findMany({
    where: { studentId, finishedAt: { gte: frequencyWindowStart(weeks) } },
    select: { finishedAt: true },
  });
  return weeklyFrequency(
    sessions.map((session) => session.finishedAt!),
    weeks,
  );
}

/** Histórico paginado de sessões finalizadas, da mais recente para a mais antiga (RF-03). */
export async function listSessions(actor: Actor, query: { limit: number; offset: number }, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);
  const where = { studentId, finishedAt: { not: null } };

  const [total, sessions] = await Promise.all([
    prisma.workoutSession.count({ where }),
    prisma.workoutSession.findMany({
      where,
      orderBy: [{ finishedAt: "desc" }, { startedAt: "desc" }],
      skip: query.offset,
      take: query.limit,
      include: { workout: { select: { name: true } }, sets: { select: { weightKg: true, reps: true } } },
    }),
  ]);

  return {
    total,
    items: sessions.map((session) => ({
      id: session.id,
      workoutName: session.workout.name,
      weekday: session.weekday,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      durationSeconds: Math.round((session.finishedAt!.getTime() - session.startedAt.getTime()) / 1000),
      totalVolumeKg: volumeKg(session.sets.map((set) => ({ weightKg: set.weightKg.toNumber(), reps: set.reps }))),
      setsCount: session.sets.length,
    })),
  };
}

/** Detalhe de uma sessão finalizada: resumo (volume e PRs) com as séries de cada exercício. */
export async function getSessionDetail(actor: Actor, sessionId: string, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);
  const summary = await buildSessionSummary(studentId, sessionId);

  const sets = await prisma.setLog.findMany({
    where: { sessionId },
    orderBy: [{ setNumber: "asc" }, { completedAt: "asc" }],
  });

  return {
    ...summary,
    exercises: summary.exercises.map((exercise) => ({
      ...exercise,
      sets: sets
        .filter((set) => set.exerciseId === exercise.exerciseId)
        .map((set) => ({
          setNumber: set.setNumber,
          weightKg: set.weightKg.toNumber(),
          reps: set.reps,
          completedAt: set.completedAt,
        })),
    })),
  };
}

/** Visão geral de um aluno para o personal: última atividade, frequência e recordes recentes (RF-05). */
export async function getStudentOverview(personalId: string, studentId: string) {
  const student = await assertStudentOfPersonal(personalId, studentId);
  const finished = { studentId, finishedAt: { not: null } };

  const [last, totalSessions, sessionsLast30Days, weekly, history] = await Promise.all([
    prisma.workoutSession.aggregate({ where: finished, _max: { finishedAt: true } }),
    prisma.workoutSession.count({ where: finished }),
    prisma.workoutSession.count({ where: { studentId, finishedAt: { gte: new Date(Date.now() - 30 * DAY_MS) } } }),
    frequencyForStudent(studentId, 8),
    loadHistory(studentId),
  ]);

  const recentPersonalRecords = [...history.values()]
    .flatMap(({ exercise, sessions }) =>
      buildExercisePoints(sessions)
        .filter((point) => point.isPersonalRecord)
        .map((point) => ({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          weightKg: point.maxWeightKg,
          reps: point.repsAtMax,
          previousBestKg: point.previousBestKg,
          date: point.date,
          sessionId: point.sessionId,
        })),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return {
    student: { id: student.id, name: student.name },
    lastSessionAt: last._max.finishedAt,
    totalSessions,
    sessionsLast30Days,
    weeklyFrequency: weekly,
    recentPersonalRecords,
  };
}
