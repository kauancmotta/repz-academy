import { z } from "zod";

export const studentQuerySchema = z.object({
  studentId: z.uuid({ error: "Aluno inválido." }).optional(),
});

export const exerciseParamSchema = z.object({
  exerciseId: z.uuid({ error: "Identificador do exercício inválido." }),
});

export const sessionParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export const frequencyQuerySchema = studentQuerySchema.extend({
  weeks: z.coerce
    .number({ error: "Informe um número de semanas." })
    .int("Informe um número inteiro de semanas.")
    .min(1, "Mínimo de 1 semana.")
    .max(52, "Máximo de 52 semanas.")
    .default(8),
});

export const sessionsQuerySchema = studentQuerySchema.extend({
  limit: z.coerce.number().int("O limite deve ser inteiro.").min(1, "Mínimo de 1.").max(100, "Máximo de 100.").default(20),
  offset: z.coerce.number().int("O deslocamento deve ser inteiro.").min(0, "Não pode ser negativo.").default(0),
});

export const overviewParamSchema = z.object({
  studentId: z.uuid({ error: "Identificador do aluno inválido." }),
});
