import { z } from "zod";
import { weekdays } from "../workouts/workouts.schemas.js";

const weightKgSchema = z
  .number({ error: "Informe a carga em kg." })
  .min(0, "A carga não pode ser negativa.")
  .max(9999.99, "A carga máxima é 9999,99 kg.")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
    message: "Use no máximo 2 casas decimais na carga.",
  });

const repsSchema = z
  .int({ error: "As repetições devem ser um número inteiro." })
  .min(1, "Informe ao menos 1 repetição.")
  .max(1000, "No máximo 1000 repetições.");

export const startSessionSchema = z.object({
  workoutId: z.uuid({ error: "Treino inválido." }),
  weekday: z.enum(weekdays, { error: "Dia da semana inválido." }),
});

export const logSetSchema = z.object({
  workoutItemId: z.uuid({ error: "Item do treino inválido." }),
  // Aceita séries além da meta do treino (o aluno pode fazer uma série extra).
  setNumber: z.int({ error: "O número da série deve ser inteiro." }).min(1, "A série começa em 1.").max(50),
  weightKg: weightKgSchema,
  reps: repsSchema,
});

export const updateSetSchema = z
  .object({
    weightKg: weightKgSchema.optional(),
    reps: repsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Informe a carga ou as repetições para atualizar." });

export const sessionIdParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export const setParamsSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
  setId: z.uuid({ error: "Identificador da série inválido." }),
});

export const exerciseIdParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export const lastPerformanceQuerySchema = z.object({
  studentId: z.uuid({ error: "Aluno inválido." }).optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type LogSetInput = z.infer<typeof logSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
