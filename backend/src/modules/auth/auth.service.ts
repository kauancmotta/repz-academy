import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";
import type { Role } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_COST = 10;

// Hash de uma senha qualquer, usado para o login gastar o mesmo tempo
// quando o e-mail não existe (evita descobrir e-mails cadastrados pelo tempo de resposta).
const DUMMY_HASH = bcrypt.hashSync("senha-ficticia-para-comparacao", BCRYPT_COST);

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function emailAlreadyUsed(): AppError {
  return new AppError(409, "EMAIL_ALREADY_USED", "Este e-mail já está cadastrado.");
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw emailAlreadyUsed();

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  try {
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
    });
    return { user: toPublicUser(user), token: signToken(user) };
  } catch (error) {
    // Cadastro simultâneo com o mesmo e-mail (violação da restrição de unicidade).
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw emailAlreadyUsed();
    }
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  return { user: toPublicUser(user), token: signToken(user) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      personal: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado. Faça login novamente.");
  }

  return user;
}
