import { prisma } from "../../lib/prisma.js";

export interface HealthStatus {
  status: "ok" | "error";
  database: "up" | "down";
}

/** Confirma que a API está no ar e que o banco responde. */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "up" };
  } catch (error) {
    console.error("Health check: falha ao consultar o banco.", error);
    return { status: "error", database: "down" };
  }
}
