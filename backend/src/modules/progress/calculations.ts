/**
 * Cálculos de evolução (RN-15, RN-16, RN-17). Funções puras, sem acesso ao banco,
 * para facilitar a conferência manual com exemplos (ver docs/specs/006-evolucao/conferencia-calculos.md).
 *
 * Cargas são comparadas e somadas em centésimos de kg (inteiros) para evitar erro de ponto flutuante.
 */

export const toCents = (kg: number): number => Math.round(kg * 100);

/** Volume (RN-16) = soma de carga × repetições das séries, em kg. */
export function volumeKg(sets: { weightKg: number; reps: number }[]): number {
  return sets.reduce((total, set) => total + toCents(set.weightKg) * set.reps, 0) / 100;
}

export interface SessionSets {
  sessionId: string;
  finishedAt: Date;
  sets: { weightKg: number; reps: number }[];
}

export interface ExercisePoint {
  sessionId: string;
  date: Date;
  maxWeightKg: number;
  /** Maior número de repetições entre as séries feitas com a carga máxima da sessão. */
  repsAtMax: number;
  volumeKg: number;
  setsCount: number;
  /** A carga máxima supera a maior de todas as sessões anteriores (a primeira sessão nunca é PR). */
  isPersonalRecord: boolean;
  /** Maior carga das sessões anteriores (nulo na primeira sessão do exercício). */
  previousBestKg: number | null;
}

/**
 * Série temporal de um exercício: um ponto por sessão finalizada, em ordem cronológica,
 * com os recordes (RN-15) marcados por varredura: carga da sessão > máximo acumulado anterior.
 */
export function buildExercisePoints(sessions: SessionSets[]): ExercisePoint[] {
  const ordered = sessions
    .filter((session) => session.sets.length > 0)
    .sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());

  let runningMaxCents: number | null = null;
  return ordered.map((session) => {
    const maxCents = Math.max(...session.sets.map((set) => toCents(set.weightKg)));
    const repsAtMax = Math.max(...session.sets.filter((set) => toCents(set.weightKg) === maxCents).map((set) => set.reps));

    const previousBestKg = runningMaxCents === null ? null : runningMaxCents / 100;
    const isPersonalRecord = runningMaxCents !== null && maxCents > runningMaxCents;
    runningMaxCents = runningMaxCents === null ? maxCents : Math.max(runningMaxCents, maxCents);

    return {
      sessionId: session.sessionId,
      date: session.finishedAt,
      maxWeightKg: maxCents / 100,
      repsAtMax,
      volumeKg: volumeKg(session.sets),
      setsCount: session.sets.length,
      isPersonalRecord,
      previousBestKg,
    };
  });
}

/** Melhor ponto da série: maior carga; em empate, a primeira vez em que foi atingida. */
export function bestPoint(points: ExercisePoint[]): ExercisePoint | null {
  let best: ExercisePoint | null = null;
  for (const point of points) {
    if (best === null || toCents(point.maxWeightKg) > toCents(best.maxWeightKg)) best = point;
  }
  return best;
}

/** Variação percentual de `previous` para `current`, com 1 casa decimal. Nulo sem base de comparação. */
export function percentChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Variação da última sessão em relação à anterior (carga máxima e volume). */
export function lastChange(points: ExercisePoint[]): { weightChangePct: number | null; volumeChangePct: number | null } {
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  if (!last || !previous) return { weightChangePct: null, volumeChangePct: null };
  return {
    weightChangePct: percentChange(last.maxWeightKg, previous.maxWeightKg),
    volumeChangePct: percentChange(last.volumeKg, previous.volumeKg),
  };
}

// ---------- Frequência semanal (RN-17) ----------

export const APP_TIME_ZONE = "America/Sao_Paulo";

/** Data local (AAAA-MM-DD) de um instante, no fuso do app. */
export function localDateKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Segunda-feira (AAAA-MM-DD) da semana da data informada. A semana começa na segunda. */
export function weekStartKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay(); // 0 = domingo
  return addDaysToKey(key, -((weekday + 6) % 7));
}

/**
 * Sessões finalizadas por semana nas últimas `weeks` semanas (a atual inclusive), da mais antiga
 * para a mais recente. Semanas sem treino aparecem com zero.
 */
export function weeklyFrequency(
  finishedAt: Date[],
  weeks: number,
  now: Date = new Date(),
): { weekStart: string; sessions: number }[] {
  const currentWeek = weekStartKey(localDateKey(now));
  const counts = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) counts.set(addDaysToKey(currentWeek, -7 * i), 0);

  for (const date of finishedAt) {
    const week = weekStartKey(localDateKey(date));
    if (counts.has(week)) counts.set(week, counts.get(week)! + 1);
  }
  return [...counts].map(([weekStart, sessions]) => ({ weekStart, sessions }));
}

/** Primeiro instante (UTC, com folga de um dia) coberto pela janela de `weeks` semanas. */
export function frequencyWindowStart(weeks: number, now: Date = new Date()): Date {
  const firstWeek = addDaysToKey(weekStartKey(localDateKey(now)), -7 * (weeks - 1));
  return new Date(Date.parse(`${firstWeek}T00:00:00Z`) - 24 * 60 * 60 * 1000);
}
