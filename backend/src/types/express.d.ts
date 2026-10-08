import type { Role } from "../generated/prisma/enums.js";

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `authenticate`. */
      user?: { id: string; role: Role };
    }
  }
}

export {};
