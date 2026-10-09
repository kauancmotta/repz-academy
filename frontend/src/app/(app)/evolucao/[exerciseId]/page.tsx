"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatKg, formatPct, formatNumber, MUSCLE_LABEL } from "@/lib/format";
import type { ExerciseProgress } from "@/lib/types";
import { WeightChart } from "@/components/charts";
import { Card, EmptyState, ErrorBanner, PageHeader, Spinner } from "@/components/ui";

function Content({ exerciseId }: { exerciseId: string }) {
  const studentId = useSearchParams().get("studentId") ?? undefined;
  const { data, error, loading } = useFetch(
    () => api.get<ExerciseProgress>(`/progress/exercises/${exerciseId}`, { studentId }),
    [exerciseId, studentId],
  );

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Exercício não encontrado."} />;

  const last = data.points[data.points.length - 1];
  const prev = data.points[data.points.length - 2];
  const delta = last && prev ? last.maxWeightKg - prev.maxWeightKg : null;
  const weightPct = formatPct(data.weightChangePct);
  const volumePct = formatPct(data.volumeChangePct);

  return (
    <>
      <PageHeader eyebrow={MUSCLE_LABEL[data.exercise.muscleGroup]} title={data.exercise.name} />
      <div className="flex flex-col gap-4">
        {data.points.length === 0 ? (
          <EmptyState title="Sem registros para este exercício" />
        ) : (
          <>
            <Card className="flex flex-col gap-3">
              <span className="text-[15px] font-bold">Carga máxima por treino (kg)</span>
              <WeightChart points={data.points} />
              <div className="flex items-center gap-2 text-[13px] text-muted">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-ink bg-accent" />
                Recorde pessoal
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-[13px] text-muted">Última sessão</p>
                <p className="text-xl font-bold">{last ? formatKg(last.maxWeightKg) : "—"}</p>
                {delta !== null && (
                  <p className={`text-[13px] font-bold ${delta >= 0 ? "text-good" : "text-danger"}`}>
                    {delta > 0 ? "+" : ""}
                    {formatNumber(delta)} kg vs. anterior
                  </p>
                )}
              </Card>
              <Card>
                <p className="text-[13px] text-muted">Recorde</p>
                <p className="text-xl font-bold">{data.personalRecord ? formatKg(data.personalRecord.weightKg) : "—"}</p>
                {data.personalRecord && <p className="text-[13px] text-muted">{formatDate(data.personalRecord.date)}</p>}
              </Card>
              <Card>
                <p className="text-[13px] text-muted">Variação da carga</p>
                <p className="text-xl font-bold">{weightPct ?? "—"}</p>
                <p className="text-[13px] text-muted">primeiro → último treino</p>
              </Card>
              <Card>
                <p className="text-[13px] text-muted">Variação do volume</p>
                <p className="text-xl font-bold">{volumePct ?? "—"}</p>
                <p className="text-[13px] text-muted">primeiro → último treino</p>
              </Card>
            </div>
          </>
        )}
        <Link href={`/evolucao${studentId ? `?studentId=${studentId}` : ""}`} className="py-2 text-center text-sm underline">
          Voltar para a evolução
        </Link>
      </div>
    </>
  );
}

export default function ExerciseProgressPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = use(params);
  return (
    <Suspense fallback={<Spinner />}>
      <Content exerciseId={exerciseId} />
    </Suspense>
  );
}
