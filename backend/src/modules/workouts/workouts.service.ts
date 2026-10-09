import { Prisma } from "../../generated/prisma/client.js";
import type { Role } from "../../generated/prisma/enums.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { toEmbedUrl } from "../exercises/youtube.js";
import { assertStudentOfPersonal } from "../links/links.access.js";
import {
  assertStudentCanManage,
  isArchivedForStudent,
  isReadOnlyForStudent,
  loadStudentContext,
  visibleToPersonal,
  visibleToStudent,
} from "./workouts.access.js";
import type { CreateWorkoutInput, UpdateWorkoutInput, WorkoutItemInput } from "./workouts.schemas.js";
import { weekdays } from "./workouts.schemas.js";

interface Actor {
  id: string;
  role: Role;
}

type Weekday = (typeof weekdays)[number];

const withItems = { items: { include: { exercise: true } } } satisfies Prisma.WorkoutInclude;
type WorkoutWithItems = Prisma.WorkoutGetPayload<{ include: typeof withItems }>;

const weekdayIndex = (weekday: string) => weekdays.indexOf(weekday as Weekday);

function sortItems(items: WorkoutWithItems["items"]) {
  return [...items].sort((a, b) => weekdayIndex(a.weekday) - weekdayIndex(b.weekday) || a.order - b.order);
}

function toItemResponse(item: WorkoutWithItems["items"][number]) {
  return {
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
  };
}

/** Agrupa os itens (já ordenados) por dia da semana. */
function groupByDay(items: WorkoutWithItems["items"]) {
  const days: { weekday: Weekday; items: ReturnType<typeof toItemResponse>[] }[] = [];
  for (const item of sortItems(items)) {
    let day = days[days.length - 1];
    if (!day || day.weekday !== item.weekday) {
      day = { weekday: item.weekday, items: [] };
      days.push(day);
    }
    day.items.push(toItemResponse(item));
  }
  return days;
}

interface ViewFlags {
  archived: boolean;
  readOnly: boolean;
}

function toDetail(workout: WorkoutWithItems, flags: ViewFlags) {
  return {
    id: workout.id,
    name: workout.name,
    studentId: workout.studentId,
    authorId: workout.authorId,
    archivedAt: workout.archivedAt,
    archived: flags.archived,
    readOnly: flags.readOnly,
    days: groupByDay(workout.items),
  };
}

function toSummary(workout: WorkoutWithItems, flags: ViewFlags) {
  return {
    id: workout.id,
    name: workout.name,
    studentId: workout.studentId,
    authorId: workout.authorId,
    archivedAt: workout.archivedAt,
    archived: flags.archived,
    readOnly: flags.readOnly,
    itemsCount: workout.items.length,
    weekdays: [...new Set(sortItems(workout.items).map((item) => item.weekday))],
  };
}

/** Flags de exibição de um treino já carregado, conforme quem está olhando. */
async function flagsFor(actor: Actor, workout: WorkoutWithItems): Promise<ViewFlags> {
  if (actor.role === "STUDENT") {
    const student = await loadStudentContext(actor.id);
    return {
      archived: isArchivedForStudent(student, workout),
      readOnly: isReadOnlyForStudent(student, workout),
    };
  }
  const archived = workout.archivedAt !== null;
  return { archived, readOnly: archived };
}

const workoutNotFound = () => new AppError(404, "WORKOUT_NOT_FOUND", "Treino não encontrado.");

/** Carrega o treino se o usuário puder enxergá-lo; caso contrário, 404 (não revela a existência). */
async function findVisibleWorkout(actor: Actor, id: string): Promise<WorkoutWithItems> {
  const where =
    actor.role === "PERSONAL" ? visibleToPersonal(actor.id) : visibleToStudent(await loadStudentContext(actor.id));

  const workout = await prisma.workout.findFirst({ where: { id, ...where }, include: withItems });
  if (!workout) throw workoutNotFound();
  return workout;
}

/**
 * Carrega o treino para alteração (editar, arquivar, remover).
 * Aluno com personal recebe 403 STUDENT_HAS_PERSONAL (RN-07); o resto segue a visibilidade.
 */
async function findManageableWorkout(actor: Actor, id: string): Promise<WorkoutWithItems> {
  if (actor.role === "STUDENT") assertStudentCanManage(await loadStudentContext(actor.id));
  return findVisibleWorkout(actor, id);
}

/** Exercícios devem ser globais ou criados pelo autor do treino. */
async function assertExercisesAvailable(authorId: string, items: WorkoutItemInput[]): Promise<void> {
  const ids = [...new Set(items.map((item) => item.exerciseId))];
  const found = await prisma.exercise.findMany({
    where: { id: { in: ids }, OR: [{ createdById: null }, { createdById: authorId }] },
    select: { id: true },
  });
  const foundIds = new Set(found.map((exercise) => exercise.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new AppError(400, "INVALID_EXERCISE", "Há exercícios inexistentes ou indisponíveis para você.", {
      exerciseIds: missing,
    });
  }
}

function toItemData(item: WorkoutItemInput) {
  return {
    exerciseId: item.exerciseId,
    weekday: item.weekday,
    order: item.order,
    sets: item.sets,
    targetReps: item.targetReps,
    restSeconds: item.restSeconds ?? null,
    notes: item.notes ?? null,
  };
}

export async function createWorkout(actor: Actor, input: CreateWorkoutInput) {
  let studentId: string;

  if (actor.role === "PERSONAL") {
    if (!input.studentId) {
      throw new AppError(400, "STUDENT_ID_REQUIRED", "Informe o aluno para quem o treino será criado.");
    }
    await assertStudentOfPersonal(actor.id, input.studentId);
    studentId = input.studentId;
  } else {
    assertStudentCanManage(await loadStudentContext(actor.id));
    studentId = actor.id;
  }

  await assertExercisesAvailable(actor.id, input.items);

  const workout = await prisma.workout.create({
    data: {
      name: input.name,
      studentId,
      authorId: actor.id,
      items: { create: input.items.map(toItemData) },
    },
    include: withItems,
  });

  return toDetail(workout, { archived: false, readOnly: false });
}

export async function listWorkouts(actor: Actor, query: { studentId?: string; archived: boolean }) {
  if (actor.role === "PERSONAL") {
    if (!query.studentId) {
      throw new AppError(400, "STUDENT_ID_REQUIRED", "Informe o aluno (studentId) para listar os treinos.");
    }
    await assertStudentOfPersonal(actor.id, query.studentId);

    const workouts = await prisma.workout.findMany({
      where: {
        ...visibleToPersonal(actor.id),
        studentId: query.studentId,
        archivedAt: query.archived ? { not: null } : null,
      },
      include: withItems,
    });
    return sortByName(workouts).map((workout) => toSummary(workout, { archived: query.archived, readOnly: query.archived }));
  }

  const student = await loadStudentContext(actor.id);
  const workouts = await prisma.workout.findMany({ where: visibleToStudent(student), include: withItems });

  return sortByName(workouts)
    .filter((workout) => isArchivedForStudent(student, workout) === query.archived)
    .map((workout) =>
      toSummary(workout, {
        archived: isArchivedForStudent(student, workout),
        readOnly: isReadOnlyForStudent(student, workout),
      }),
    );
}

const sortByName = (workouts: WorkoutWithItems[]) =>
  [...workouts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export async function getWorkout(actor: Actor, id: string) {
  const workout = await findVisibleWorkout(actor, id);
  return toDetail(workout, await flagsFor(actor, workout));
}

export async function updateWorkout(actor: Actor, id: string, input: UpdateWorkoutInput) {
  const workout = await findManageableWorkout(actor, id);

  if (workout.archivedAt !== null) {
    throw new AppError(422, "WORKOUT_ARCHIVED", "Treino arquivado não pode ser editado. Desarquive-o primeiro.");
  }

  await assertExercisesAvailable(actor.id, input.items);

  // Substituição completa dos itens, tudo ou nada.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.workoutItem.deleteMany({ where: { workoutId: id } });
    return tx.workout.update({
      where: { id },
      data: { name: input.name, items: { create: input.items.map(toItemData) } },
      include: withItems,
    });
  });

  return toDetail(updated, { archived: false, readOnly: false });
}

async function setArchived(actor: Actor, id: string, archive: boolean) {
  const workout = await findManageableWorkout(actor, id);

  // Idempotente: arquivar um treino já arquivado (ou o inverso) devolve o estado atual.
  if ((workout.archivedAt !== null) === archive) {
    return toDetail(workout, await flagsFor(actor, workout));
  }

  const updated = await prisma.workout.update({
    where: { id },
    data: { archivedAt: archive ? new Date() : null },
    include: withItems,
  });
  return toDetail(updated, { archived: archive, readOnly: archive });
}

export const archiveWorkout = (actor: Actor, id: string) => setArchived(actor, id, true);
export const unarchiveWorkout = (actor: Actor, id: string) => setArchived(actor, id, false);

/**
 * Remove o treino (e seus itens, em cascata). Se houver sessões registradas (005), a chave estrangeira
 * restrita do banco recusa a exclusão (P2003) e respondemos 409, orientando a arquivar.
 */
export async function deleteWorkout(actor: Actor, id: string) {
  await findManageableWorkout(actor, id);

  try {
    await prisma.workout.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2003" || error.code === "P2014")) {
      throw new AppError(
        409,
        "WORKOUT_HAS_SESSIONS",
        "Este treino já tem sessões registradas e não pode ser removido. Arquive-o para escondê-lo.",
      );
    }
    throw error;
  }
}

/** Dia da semana de hoje em America/Sao_Paulo (a data do servidor pode estar em outro fuso). */
export function currentWeekday(now: Date = new Date()): Weekday {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Sao_Paulo" })
    .format(now)
    .toUpperCase();
  return name as Weekday;
}

/** Itens de hoje dos treinos ativos (não arquivados) do aluno (RF-08). */
export async function getTodayWorkouts(actor: Actor) {
  const student = await loadStudentContext(actor.id);
  const weekday = currentWeekday();

  const workouts = await prisma.workout.findMany({
    where: { ...visibleToStudent(student), archivedAt: null },
    include: withItems,
  });

  const result = sortByName(workouts)
    .filter((workout) => !isArchivedForStudent(student, workout))
    .map((workout) => ({
      id: workout.id,
      name: workout.name,
      items: sortItems(workout.items.filter((item) => item.weekday === weekday)).map(toItemResponse),
    }))
    .filter((workout) => workout.items.length > 0);

  return { weekday, workouts: result };
}
