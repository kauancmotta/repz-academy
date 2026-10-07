/**
 * Erro de negócio com status HTTP e código estável para o frontend.
 * Exemplo: throw new AppError(409, "EMAIL_ALREADY_USED", "E-mail já cadastrado.");
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
