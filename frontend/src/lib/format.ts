import type { MuscleGroup, Weekday } from "./types";

export const WEEKDAYS: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  MONDAY: "Seg",
  TUESDAY: "Ter",
  WEDNESDAY: "Qua",
  THURSDAY: "Qui",
  FRIDAY: "Sex",
  SATURDAY: "Sáb",
  SUNDAY: "Dom",
};

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  CHEST: "Peito",
  BACK: "Costas",
  SHOULDERS: "Ombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  LEGS: "Pernas",
  GLUTES: "Glúteos",
  CORE: "Abdômen",
  CARDIO: "Cardio",
  OTHER: "Outros",
};

export const MUSCLE_GROUPS = Object.keys(MUSCLE_LABEL) as MuscleGroup[];

const TZ = "America/Sao_Paulo";

/** Peso em kg com até 2 casas e vírgula decimal: 57,5 kg. */
export function formatKg(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} kg`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

/** Converte "57,5" ou "57.5" em número; devolve null se inválido. */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "ontem", "há 3 dias", "há 3 semanas"... */
export function timeAgo(iso: string | null): string {
  if (!iso) return "nunca treinou";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 14) return `há ${days} dias`;
  if (days < 60) return `há ${Math.floor(days / 7)} semanas`;
  return `há ${Math.floor(days / 30)} meses`;
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function formatPct(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
