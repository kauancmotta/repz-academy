import { Prisma } from "../../generated/prisma/client.js";
import type { SetLog } from "../../generated/prisma/client.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { toEmbedUrl } from "../exercises/youtube.js";
import { resolveTargetStudent } from "../links/links.access.js";
import { isArchivedForStudent, loadStudentContext, visibleToStudent } from "../workouts/workouts.access.js";
import { lastPerformanceByExercise } from "./sessions.performance.js";
import type { LogSetInput, StartSessionInput, UpdateSetInput } from "./sessions.schemas.js";
import { buildSessionSummary } from "./sessions.summary.js";

interface Actor {
  id: string;
  role: "PERSONAL" | "STUDENT";
}

const sessionNotFound = () => new AppError(404, "SESSION_NOT_FOUND", "Sessão não encontrada.");

function toSetResponse(set: SetLog) {
  return {
    id: set.id,
    workoutItemId: set.workoutItemId,
    exerciseId: set.exerciseId,
    setNumber: set.setNumber,
    weightKg: set.weightKg.toNumber(),
    reps: set.reps,
    completedAt: set.completedAt,
  };
}

/** Sessão do próprio aluno; 404 se não existir ou for de outro aluno. */
async function findOwnSession(studentId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) throw sessionNotFound();
  return session;
}

/** Série e sessão em andamento do aluno, para editar ou remover. */
async function findOpenSession(studentId: string, sessionId: string) {
  const session = await findOwnSession(studentId, sessionId);
  if (session.finishedAt) {
    throw new AppError(422, "SESSION_FINISHED", "Esta sessão já foi finalizada e não aceita alterações.");
  }
  return session;
}

/**
 * Visão da sessão para o frontend: itens do dia (ordenados), séries já registradas em cada item
 * e "da última vez" de cada exercício.
 */
async function buildSessionView(studentId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirstOrThrow({
    where: { id: sessionId, studentId },
    include: {
      workout: {
        select: {
          name: true,
          items: { include: { exercise: true } },
        },
      },
      sets: { orderBy: [{ setNumber: "asc" }, { completedAt: "asc" }] },
    },
  });

  const dayItems = session.workout.items
    .filter((item) => item.weekday === session.weekday)
    .sort((a, b) => a.order - b.order);

  const last = await lastPerformanceByExercise(studentId, [...new Set(dayItems.map((item) => item.exerciseId))]);

  return {
    id: session.id,
    workoutId: session.workoutId,
    workoutName: session.workout.name,
    weekday: session.weekday,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    items: dayItems.map((item) => ({
      id: item.id,
      order: item.order,
      exercise: {
        id: item.exercise.id,
        name: item.exercise.name,
        muscleGroup: item.exercise.muscleGroup,
        videoEmbedUrl: toEmbedUrl(item.exercise.videoUrl),
      },
      sets: item.sets,
      targetReps: item.targetReps,
      restSeconds: item.restSeconds,
      notes: item.notes,
      lastPerformance: last.get(item.exerciseId) ?? null,
      loggedSets: session.sets.filter((set) => set.workoutItemId === item.id).map(toSetResponse),
    })),
  };
}

/** Inicia uma sessão (RF-01). Um aluno só pode ter uma sessão em andamento. */
export async function startSession(studentId: string, input: StartSessionInput) {
  const student = await loadStudentContext(studentId);

  const workout = await prisma.workout.findFirst({
    where: { id: input.workoutId, ...visibleToStudent(student) },
    include: { items: { select: { weekday: true } } },
  });
  if (!workout) throw new AppError(404, "WORKOUT_NOT_FOUND", "Treino não encontrado.");

  if (isArchivedForStudent(student, workout)) {
    throw new AppError(422, "WORKOUT_ARCHIVED", "Treino arquivado não pode ser executado.");
  }
  if (!workout.items.some((item) => item.weekday === input.weekday)) {
    throw new AppError(422, "NO_ITEMS_FOR_WEEKDAY", "Este treino não tem exercícios no dia escolhido.");
  }

  // O lock serializa inícios simultâneos do mesmo aluno (ex.: duplo clique), evitando duas sessões abertas.
  const sessionId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId}))`;

    const open = await tx.workoutSession.findFirst({ where: { studentId, finishedAt: null }, select: { id: true } });
    if (open) {
      throw new AppError(409, "SESSION_IN_PROGRESS", "Você já tem um treino em andamento.", { sessionId: open.id });
    }

    const created = await tx.workoutSession.create({
      data: { studentId, workoutId: workout.id, weekday: input.weekday },
      select: { id: true },
    });
    return created.id;
  });

  return buildSessionView(studentId, sessionId);
}

/** Sessão em andamento do aluno (RF-06). */
export async function getCurrentSession(studentId: string) {
  const open = await prisma.workoutSession.findFirst({
    where: { studentId, finishedAt: null },
    select: { id: true },
  });
  if (!open) throw new AppError(404, "NO_ACTIVE_SESSION", "Você não tem treino em andamento.");
  return buildSessionView(studentId, open.id);
}

/** Registra uma série (RN-13). O item precisa pertencer ao treino da sessão e ao dia da sessão. */
export async function logSet(studentId: string, sessionId: string, input: LogSetInput) {
  const session = await findOpenSession(studentId, sessionId);

  const item = await prisma.workoutItem.findFirst({
    where: { id: input.workoutItemId, workoutId: session.workoutId, weekday: session.weekday },
    select: { id: true, exerciseId: true },
  });
  if (!item) {
    throw new AppError(
      400,
      "INVALID_WORKOUT_ITEM",
      "Esse exercício não faz parte do treino desta sessão. Recarregue o treino e tente de novo.",
    );
  }

  try {
    const set = await prisma.setLog.create({
      data: {
        sessionId,
        workoutItemId: item.id,
        exerciseId: item.exerciseId,
        setNumber: input.setNumber,
        weightKg: input.weightKg,
        reps: input.reps,
      },
    });
    return toSetResponse(set);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "SET_ALREADY_LOGGED", "Essa série já foi registrada. Edite-a se precisar corrigir.");
    }
    throw error;
  }
}

async function findOwnSet(sessionId: string, setId: string) {
  const set = await prisma.setLog.findFirst({ where: { id: setId, sessionId } });
  if (!set) throw new AppError(404, "SET_NOT_FOUND", "Série não encontrada.");
  return set;
}

export async function updateSet(studentId: string, sessionId: string, setId: string, input: UpdateSetInput) {
  await findOpenSession(studentId, sessionId);
  await findOwnSet(sessionId, setId);

  const set = await prisma.setLog.update({
    where: { id: setId },
    data: {
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.reps !== undefined ? { reps: input.reps } : {}),
    },
  });
  return toSetResponse(set);
}

export async function deleteSet(studentId: string, sessionId: string, setId: string) {
  await findOpenSession(studentId, sessionId);
  await findOwnSet(sessionId, setId);
  await prisma.setLog.delete({ where: { id: setId } });
}

/** Finaliza a sessão e devolve o resumo com volume e PRs (RF-04). */
export async function finishSession(studentId: string, sessionId: string) {
  await findOpenSession(studentId, sessionId);

  const setsCount = await prisma.setLog.count({ where: { sessionId } });
  if (setsCount === 0) {
    throw new AppError(422, "EMPTY_SESSION", "Registre ao menos uma série antes de finalizar, ou cancele o treino.");
  }

  // Condicional: se duas requisições finalizarem ao mesmo tempo, só uma vence.
  const { count } = await prisma.workoutSession.updateMany({
    where: { id: sessionId, studentId, finishedAt: null },
    data: { finishedAt: new Date() },
  });
  if (count === 0) {
    throw new AppError(422, "SESSION_FINISHED", "Esta sessão já foi finalizada e não aceita alterações.");
  }

  return buildSessionSummary(studentId, sessionId);
}

/** Cancela uma sessão em andamento; as séries são apagadas junto (cascata). */
export async function cancelSession(studentId: string, sessionId: string) {
  await findOpenSession(studentId, sessionId);
  await prisma.workoutSession.delete({ where: { id: sessionId } });
}

/** "Da última vez" de um exercício (RF-05). Aluno consulta o próprio; personal, de aluno vinculado. */
export async function getLastPerformance(actor: Actor, exerciseId: string, studentIdParam?: string) {
  const studentId = await resolveTargetStudent(actor, studentIdParam);

  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { id: true } });
  if (!exercise) throw new AppError(404, "EXERCISE_NOT_FOUND", "Exercício não encontrado.");

  const last = (await lastPerformanceByExercise(studentId, [exerciseId])).get(exerciseId);
  return last ?? { sets: [] };
}
