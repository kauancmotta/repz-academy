"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatDuration, formatKg, formatPct, MUSCLE_LABEL, WEEKDAY_LABEL } from "@/lib/format";
import type { ProgressExercise, SessionHistory, WeeklyFrequency } from "@/lib/types";
import { FrequencyChart } from "@/components/charts";
import { Card, EmptyState, ErrorBanner, PageHeader, Spinner } from "@/components/ui";

function Content() {
  const studentId = useSearchParams().get("studentId") ?? undefined;
  const suffix = studentId ? `?studentId=${studentId}` : "";

  const frequency = useFetch(() => api.get<WeeklyFrequency[]>("/progress/frequency", { weeks: 8, studentId }), [studentId]);
  const exercises = useFetch(() => api.get<ProgressExercise[]>("/progress/exercises", { studentId }), [studentId]);
  const history = useFetch(() => api.get<SessionHistory>("/progress/sessions", { limit: 10, studentId }), [studentId]);

  if (frequency.loading || exercises.loading || history.loading) return <Spinner />;

  const error = frequency.error ?? exercises.error ?? history.error;
  const thisWeek = frequency.data?.[frequency.data.length - 1]?.sessions ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBanner message={error} />

      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold">Treinos por semana</span>
          <span className="text-[13px] text-muted">8 semanas</span>
        </div>
        <FrequencyChart data={frequency.data ?? []} />
        <p className="text-sm text-muted">
          <span className="font-bold text-ink">{thisWeek}</span> {thisWeek === 1 ? "treino" : "treinos"} nesta semana
        </p>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold">Por exercício</h2>
        {(exercises.data ?? []).length === 0 ? (
          <EmptyState title="Ainda sem histórico" text="Finalize um treino para ver a evolução das cargas." />
        ) : (
          exercises.data?.map((ex) => {
            const pct = formatPct(ex.weightChangePct);
            return (
              <Link key={ex.exerciseId} href={`/evolucao/${ex.exerciseId}${suffix}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-bold">{ex.name}</p>
                    <p className="text-sm text-muted">
                      {MUSCLE_LABEL[ex.muscleGroup]} · {ex.sessionsCount} {ex.sessionsCount === 1 ? "treino" : "treinos"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatKg(ex.lastMaxWeightKg)}</p>
                    {pct && <p className={`text-[13px] font-bold ${ex.weightChangePct! >= 0 ? "text-good" : "text-danger"}`}>{pct}</p>}
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold">Histórico</h2>
        {(history.data?.items ?? []).length === 0 ? (
          <EmptyState title="Nenhum treino finalizado" />
        ) : (
          history.data?.items.map((s) => (
            <Link key={s.id} href={`/resumo/${s.id}${suffix}`}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold">{s.workoutName}</p>
                  <p className="text-sm text-muted">
                    {formatDate(s.finishedAt)} · {WEEKDAY_LABEL[s.weekday]}
                  </p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>{formatDuration(s.durationSeconds)}</p>
                  <p>{formatKg(s.totalVolumeKg)}</p>
                </div>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

export default function EvolucaoPage() {
  return (
    <>
      <PageHeader eyebrow="Acompanhe seu progresso" title="Evolução" />
      <Suspense fallback={<Spinner />}>
        <Content />
      </Suspense>
    </>
  );
}
