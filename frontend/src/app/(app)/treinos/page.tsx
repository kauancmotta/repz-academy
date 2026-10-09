"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFetch } from "@/lib/useFetch";
import { WEEKDAY_SHORT } from "@/lib/format";
import type { Student, WorkoutSummary } from "@/lib/types";
import { Badge, Card, EmptyState, ErrorBanner, Field, LinkButton, PageHeader, Select, Spinner } from "@/components/ui";

function Content() {
  const { user } = useAuth();
  const router = useRouter();
  const isPersonal = user?.role === "PERSONAL";
  const studentId = useSearchParams().get("studentId") ?? "";
  const [archived, setArchived] = useState(false);

  const students = useFetch(async () => (isPersonal ? api.get<Student[]>("/students") : []), [isPersonal]);
  const needsStudent = isPersonal && !studentId;
  const workouts = useFetch(
    async () => (needsStudent ? [] : api.get<WorkoutSummary[]>("/workouts", { archived, studentId: studentId || undefined })),
    [archived, studentId, needsStudent],
  );

  const canCreate = isPersonal ? Boolean(studentId) : !user?.personal;
  const newHref = `/treinos/novo${studentId ? `?studentId=${studentId}` : ""}`;

  return (
    <div className="flex flex-col gap-3">
      <ErrorBanner message={students.error ?? workouts.error} />

      {isPersonal && (
        <Field label="Aluno" htmlFor="aluno">
          <Select id="aluno" value={studentId} onChange={(e) => router.replace(e.target.value ? `/treinos?studentId=${e.target.value}` : "/treinos")}>
            <option value="">Selecione um aluno...</option>
            {(students.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {needsStudent ? (
        <EmptyState title="Escolha um aluno" text="Selecione o aluno para ver e montar os treinos dele." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div role="tablist" className="flex gap-2">
              {[false, true].map((flag) => (
                <button
                  key={String(flag)}
                  type="button"
                  role="tab"
                  aria-selected={archived === flag}
                  onClick={() => setArchived(flag)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
                    archived === flag ? "border-ink bg-ink text-accent" : "border-line bg-white text-muted"
                  }`}
                >
                  {flag ? "Arquivados" : "Ativos"}
                </button>
              ))}
            </div>
            {canCreate && (
              <LinkButton href={newHref} variant="dark" className="!h-10 !px-4 text-sm">
                Novo treino
              </LinkButton>
            )}
          </div>

          {workouts.loading ? (
            <Spinner />
          ) : (workouts.data ?? []).length === 0 ? (
            <EmptyState
              title={archived ? "Nenhum treino arquivado" : "Nenhum treino por aqui"}
              text={!archived && !canCreate && !isPersonal ? "Seu personal ainda não montou treinos para você." : undefined}
            />
          ) : (
            workouts.data?.map((w) => (
              <Link key={w.id} href={`/treinos/${w.id}${studentId ? `?studentId=${studentId}` : ""}`}>
                <Card className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-lg font-bold">{w.name}</span>
                    {w.archived ? <Badge tone="neutral">Arquivado</Badge> : w.readOnly ? <Badge tone="neutral">Somente leitura</Badge> : null}
                  </div>
                  <p className="text-sm text-muted">
                    {w.itemsCount} exercícios · {w.weekdays.map((d) => WEEKDAY_SHORT[d]).join(", ")}
                  </p>
                </Card>
              </Link>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default function TreinosPage() {
  return (
    <>
      <PageHeader eyebrow="Planejamento" title="Treinos" />
      <Suspense fallback={<Spinner />}>
        <Content />
      </Suspense>
    </>
  );
}
