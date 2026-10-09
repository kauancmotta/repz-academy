"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDuration, formatKg } from "@/lib/format";
import type { SessionDetail } from "@/lib/types";
import { ErrorBanner, LinkButton, Spinner } from "@/components/ui";

function Content({ id }: { id: string }) {
  const studentId = useSearchParams().get("studentId") ?? undefined;
  const { data, error, loading } = useFetch(() => api.get<SessionDetail>(`/progress/sessions/${id}`, { studentId }), [id, studentId]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Sessão não encontrada."} />;

  return (
    <div className="-mx-6 -mt-3 flex min-h-[calc(100vh-3rem)] flex-col gap-6 bg-ink px-6 pb-28 pt-12 text-bg">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold uppercase tracking-[3px] text-accent">Treino finalizado</p>
        <h1 className="font-display text-4xl font-semibold leading-tight">{data.workoutName}</h1>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-dark2 p-4">
          <p className="text-[13px] text-soft">Duração</p>
          <p className="text-2xl font-bold">{formatDuration(data.durationSeconds)}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-dark2 p-4">
          <p className="text-[13px] text-soft">Volume total</p>
          <p className="text-2xl font-bold">{formatKg(data.totalVolumeKg)}</p>
        </div>
      </div>

      {data.personalRecords.length > 0 ? (
        data.personalRecords.map((pr) => (
          <div key={pr.exerciseId} className="flex flex-col gap-1.5 rounded-2xl bg-accent p-4 text-ink">
            <p className="text-[13px] font-bold uppercase tracking-[2px]">Recorde pessoal</p>
            <p className="text-[22px] font-bold">
              {pr.exerciseName}: {formatKg(pr.weightKg)}
            </p>
            {pr.previousBestKg !== null && <p className="text-[15px]">Antes: {formatKg(pr.previousBestKg)}</p>}
          </div>
        ))
      ) : (
        <p className="rounded-2xl bg-dark2 p-4 text-sm text-soft">Sem recordes desta vez — a constância é o que constrói a evolução.</p>
      )}

      <div className="flex flex-col">
        <p className="mb-1 text-[15px] font-bold text-soft">Por exercício</p>
        {data.exercises.map((ex) => (
          <div key={ex.exerciseId} className="flex justify-between gap-3 border-b border-[#2B3238] py-3 text-base">
            <span>{ex.exerciseName}</span>
            <span className="text-right">
              {ex.setsCount} {ex.setsCount === 1 ? "série" : "séries"} · {formatKg(ex.maxWeightKg)} máx.
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {studentId ? (
          <LinkButton href={`/evolucao?studentId=${studentId}`} full>
            Ver evolução do aluno
          </LinkButton>
        ) : (
          <>
            <LinkButton href="/evolucao" full>
              Ver minha evolução
            </LinkButton>
            <LinkButton href="/hoje" variant="outline" full>
              Voltar ao início
            </LinkButton>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<Spinner />}>
      <Content id={id} />
    </Suspense>
  );
}
