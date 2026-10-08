import { z } from "zod";
import { Role } from "../../generated/prisma/enums.js";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "E-mail inválido." }));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter ao menos 2 caracteres.").max(100, "O nome deve ter no máximo 100 caracteres."),
  email,
  // Máximo de 72: o bcrypt só considera os primeiros 72 bytes da senha.
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres."),
  role: z.enum(Role, { error: "Perfil inválido. Use PERSONAL ou STUDENT." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
