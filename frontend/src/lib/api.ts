// Único ponto de acesso HTTP à API do backend.
// Responsabilidades: URL base, cabeçalho Authorization, erro tipado e logout em 401.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const TOKEN_KEY = "repz.token";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível: sessão vale só até recarregar */
  }
}

let onUnauthorized: (() => void) | null = null;

/** O contexto de autenticação registra aqui o que fazer quando a API responde 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Em login/cadastro um 401 é erro de credenciais, não sessão expirada. */
  skipAuthRedirect?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_URL.replace(/\/$/, "") + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, skipAuthRedirect = false } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (response.status === 401 && !skipAuthRedirect) onUnauthorized?.();
    throw new ApiError(
      response.status,
      err?.code ?? "UNKNOWN_ERROR",
      err?.message ?? "Ocorreu um erro inesperado. Tente novamente.",
      err?.details,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, opts?: Pick<RequestOptions, "skipAuthRedirect" | "query">) =>
    request<T>(path, { method: "POST", body, ...opts }),
  put: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: "PUT", body, query }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  del: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Mensagem amigável a partir de qualquer erro capturado. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}

/** Erros de validação por campo (VALIDATION_ERROR → { campo: mensagem }). */
export function fieldErrorsFrom(error: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR" && Array.isArray(error.details)) {
    for (const d of error.details as { field?: string; message?: string }[]) {
      if (d.field && d.message && !map[d.field]) map[d.field] = d.message;
    }
  }
  return map;
}
