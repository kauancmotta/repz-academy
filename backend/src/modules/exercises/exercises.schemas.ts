import { z } from "zod";
import { extractYoutubeId } from "./youtube.js";

export const muscleGroups = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "CORE",
  "CARDIO",
  "OTHER",
] as const;

const muscleGroupSchema = z.enum(muscleGroups, { error: "Grupo muscular inválido." });

const nameSchema = z
  .string({ error: "Informe o nome do exercício." })
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres.")
  .max(100, "O nome deve ter no máximo 100 caracteres.");

// Texto opcional: string vazia vira null (limpa o campo).
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value))
    .nullable();

const videoUrlSchema = z
  .string()
  .trim()
  .max(300, "O link deve ter no máximo 300 caracteres.")
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine((value) => value === null || extractYoutubeId(value) !== null, {
    message: "Informe um link válido do YouTube (youtube.com/watch?v=, youtu.be/ ou youtube.com/embed/).",
  });

export const createExerciseSchema = z.object({
  name: nameSchema,
  muscleGroup: muscleGroupSchema,
  description: optionalText(1000, "A descrição deve ter no máximo 1000 caracteres.").optional(),
  videoUrl: videoUrlSchema.optional(),
});

export const updateExerciseSchema = z
  .object({
    name: nameSchema.optional(),
    muscleGroup: muscleGroupSchema.optional(),
    description: optionalText(1000, "A descrição deve ter no máximo 1000 caracteres.").optional(),
    videoUrl: videoUrlSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Informe ao menos um campo para atualizar." });

export const listExercisesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  muscleGroup: muscleGroupSchema.optional(),
});

export const exerciseIdParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ListExercisesQuery = z.infer<typeof listExercisesQuerySchema>;
