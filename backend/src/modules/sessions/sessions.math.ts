/**
 * Cálculos de carga e volume. Os valores são convertidos para centésimos de kg (inteiros)
 * antes de multiplicar, evitando erros de ponto flutuante (ex.: 7,1 × 3).
 */

export const toCents = (kg: number): number => Math.round(kg * 100);

/** Volume (RN-16) = soma de carga × repetições das séries, em kg. */
export function volumeKg(sets: { weightKg: number; reps: number }[]): number {
  const cents = sets.reduce((total, set) => total + toCents(set.weightKg) * set.reps, 0);
  return cents / 100;
}
