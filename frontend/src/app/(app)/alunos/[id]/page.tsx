"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatKg, timeAgo } from "@/lib/format";
import type { StudentOverview } from "@/lib/types";
import { FrequencyChart } from "@/components/charts";
import { Button, Card, EmptyState, ErrorBanner, LinkButton, PageHeader, Spinner } from "@/components/ui";

export default function AlunoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, loading } = useFetch(() => api.get<StudentOverview>(`/students/${id}/overview`), [id]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Remover este aluno? Os treinos criados por você para ele ficarão arquivados e somente leitura.")) return;
    try {
      await api.del(`/students/${id}`);
      router.replace("/alunos");
    } catch (e) {
      setActionError(errorMessage(e));
    }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Aluno não encontrado."} />;

  return (
    <>
      <PageHeader eyebrow="Aluno" title={data.student.name} subtitle={`Último treino: ${timeAgo(data.lastSessionAt)}`} />
      <div className="flex flex-col gap-4">
        <ErrorBanner message={actionError} />

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-[13px] text-muted">Treinos nos últimos 30 dias</p>
            <p className="text-2xl font-bold">{data.sessionsLast30Days}</p>
          </Card>
          <Card>
            <p className="text-[13px] text-muted">Total de treinos</p>
            <p className="text-2xl font-bold">{data.totalSessions}</p>
          </Card>
        </div>

        <Card className="flex flex-col gap-3">
          <span className="text-[15px] font-bold">Frequência semanal</span>
          <FrequencyChart data={data.weeklyFrequency} />
        </Card>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold">Recordes recentes</h2>
          {data.recentPersonalRecords.length === 0 ? (
            <EmptyState title="Ainda sem recordes" />
          ) : (
            data.recentPersonalRecords.map((pr) => (
              <Card key={`${pr.sessionId}-${pr.exerciseId}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{pr.exerciseName}</p>
                  <p className="text-sm text-muted">{formatDate(pr.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatKg(pr.weightKg)}</p>
                  {pr.previousBestKg !== null && <p className="text-[13px] text-muted">antes {formatKg(pr.previousBestKg)}</p>}
                </div>
              </Card>
            ))
          )}
        </section>

        <div className="flex flex-col gap-3">
          <LinkButton href={`/treinos?studentId=${id}`} variant="dark" full>
            Treinos do aluno
          </LinkButton>
          <LinkButton href={`/evolucao?studentId=${id}`} variant="outline" full>
            Evolução por exercício
          </LinkButton>
          <Button variant="danger" full onClick={remove}>
            Remover aluno
          </Button>
        </div>
      </div>
    </>
  );
}
