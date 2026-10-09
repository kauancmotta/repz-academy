import { Prisma } from "../../generated/prisma/client.js";
import type { Exercise } from "../../generated/prisma/client.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateExerciseInput, ListExercisesQuery, UpdateExerciseInput } from "./exercises.schemas.js";
import { toEmbedUrl } from "./youtube.js";

/** Minúsculas e sem acentos, para comparar nomes e termos de busca. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function toResponse(exercise: Exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    description: exercise.description,
    videoUrl: exercise.videoUrl,
    videoEmbedUrl: toEmbedUrl(exercise.videoUrl),
    isGlobal: exercise.createdById === null,
  };
}

/**
 * Busca um exercício e confirma que o usuário pode alterá-lo (RN-11).
 * 404 se não existe; 403 se for global ou de outro usuário.
 */
async function findOwnedExercise(userId: string, id: string): Promise<Exercise> {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    throw new AppError(404, "EXERCISE_NOT_FOUND", "Exercício não encontrado.");
  }
  if (exercise.createdById !== userId) {
    throw new AppError(403, "FORBIDDEN", "Você só pode alterar exercícios criados por você.");
  }
  return exercise;
}

/** Garante que o usuário não tenha dois exercícios com o mesmo nome (sem diferenciar acentos/maiúsculas). */
async function assertNameAvailable(userId: string, name: string, ignoreId?: string): Promise<void> {
  const own = await prisma.exercise.findMany({
    where: { createdById: userId, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
    select: { name: true },
  });
  const wanted = normalizeText(name);
  if (own.some((item) => normalizeText(item.name) === wanted)) {
    throw new AppError(409, "EXERCISE_ALREADY_EXISTS", "Você já tem um exercício com esse nome.");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Lista os exercícios globais e os do próprio usuário (RF-02).
 * A busca ignora acentos e maiúsculas. Como o catálogo é pequeno, o texto é filtrado em memória
 * (evita depender da extensão unaccent do PostgreSQL); o grupo muscular é filtrado no banco.
 */
export async function listExercises(userId: string, query: ListExercisesQuery) {
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ createdById: null }, { createdById: userId }],
      ...(query.muscleGroup ? { muscleGroup: query.muscleGroup } : {}),
    },
  });

  const term = query.search ? normalizeText(query.search) : "";
  return exercises
    .filter((exercise) => !term || normalizeText(exercise.name).includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map(toResponse);
}

export async function createExercise(userId: string, input: CreateExerciseInput) {
  await assertNameAvailable(userId, input.name);

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name: input.name,
        muscleGroup: input.muscleGroup,
        description: input.description ?? null,
        videoUrl: input.videoUrl ?? null,
        createdById: userId,
      },
    });
    return toResponse(exercise);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "EXERCISE_ALREADY_EXISTS", "Você já tem um exercício com esse nome.");
    }
    throw error;
  }
}

export async function updateExercise(userId: string, id: string, input: UpdateExerciseInput) {
  await findOwnedExercise(userId, id);
  if (input.name !== undefined) await assertNameAvailable(userId, input.name, id);

  try {
    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.muscleGroup !== undefined ? { muscleGroup: input.muscleGroup } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.videoUrl !== undefined ? { videoUrl: input.videoUrl } : {}),
      },
    });
    return toResponse(exercise);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "EXERCISE_ALREADY_EXISTS", "Você já tem um exercício com esse nome.");
    }
    throw error;
  }
}

/**
 * Remove um exercício próprio. Se algum treino ou sessão referenciar o exercício, o banco recusa
 * a exclusão (violação de chave estrangeira, P2003) e respondemos 409 (RN-11).
 */
export async function deleteExercise(userId: string, id: string) {
  await findOwnedExercise(userId, id);

  try {
    await prisma.exercise.delete({ where: { id } });
  } catch (error) {
    const inUse =
      error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2003" || error.code === "P2014");
    if (inUse) {
      throw new AppError(409, "EXERCISE_IN_USE", "Este exercício está em uso em treinos ou sessões e não pode ser removido.");
    }
    throw error;
  }
}
