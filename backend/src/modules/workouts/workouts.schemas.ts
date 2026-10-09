import { z } from "zod";

export const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const nameSchema = z
  .string({ error: "Informe o nome do treino." })
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres.")
  .max(100, "O nome deve ter no máximo 100 caracteres.");

const itemSchema = z.object({
  exerciseId: z.uuid({ error: "Exercício inválido." }),
  weekday: z.enum(weekdays, { error: "Dia da semana inválido." }),
  order: z.int({ error: "A ordem deve ser um número inteiro." }).min(1, "A ordem deve ser maior que zero.").max(100),
  sets: z
    .int({ error: "O número de séries deve ser um inteiro." })
    .min(1, "Informe ao menos 1 série.")
    .max(20, "No máximo 20 séries por exercício."),
  targetReps: z
    .int({ error: "As repetições devem ser um número inteiro." })
    .min(1, "Informe ao menos 1 repetição.")
    .max(100, "No máximo 100 repetições."),
  restSeconds: z
    .int({ error: "O descanso deve ser um número inteiro de segundos." })
    .min(0, "O descanso não pode ser negativo.")
    .max(3600, "O descanso deve ter no máximo 3600 segundos.")
    .nullish(),
  notes: z
    .string()
    .trim()
    .max(300, "A observação deve ter no máximo 300 caracteres.")
    .transform((value) => (value === "" ? null : value))
    .nullish(),
});

const itemsSchema = z
  .array(itemSchema, { error: "Informe os itens do treino." })
  .min(1, "O treino precisa ter ao menos um exercício.")
  .max(100, "O treino pode ter no máximo 100 itens.");

type Item = z.infer<typeof itemSchema>;

/** Dois itens do mesmo dia não podem ter a mesma ordem. */
function checkUniqueOrder(data: { items: Item[] }, ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  data.items.forEach((item, index) => {
    const key = `${item.weekday}:${item.order}`;
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        path: ["items", index, "order"],
        message: "Já existe um item com essa ordem neste dia.",
      });
    }
    seen.add(key);
  });
}

export const createWorkoutSchema = z
  .object({
    name: nameSchema,
    // Obrigatório para PERSONAL e ignorado para STUDENT (validado no serviço).
    studentId: z.uuid({ error: "Aluno inválido." }).optional(),
    items: itemsSchema,
  })
  .superRefine(checkUniqueOrder);

export const updateWorkoutSchema = z.object({ name: nameSchema, items: itemsSchema }).superRefine(checkUniqueOrder);

export const listWorkoutsQuerySchema = z.object({
  studentId: z.uuid({ error: "Aluno inválido." }).optional(),
  archived: z
    .enum(["true", "false"], { error: "Use archived=true ou archived=false." })
    .default("false")
    .transform((value) => value === "true"),
});

export const workoutIdParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type WorkoutItemInput = Item;
