import { z } from "zod";

export const redeemInviteSchema = z.object({
  // O código é mostrado em maiúsculas; aceitamos minúsculas e espaços ao redor.
  code: z.string().trim().toUpperCase().min(1, "Informe o código do convite.").max(32, "Código inválido."),
});

export const idParamSchema = z.object({
  id: z.uuid({ error: "Identificador inválido." }),
});

export const studentIdParamSchema = z.object({
  studentId: z.uuid({ error: "Identificador inválido." }),
});

export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>;
