import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback evita falha no "prisma generate" (postinstall) quando o .env ainda não existe.
    url: process.env.DATABASE_URL ?? "postgresql://repz:repz@localhost:5432/repz?schema=public",
  },
});
