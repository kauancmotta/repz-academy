"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { MUSCLE_LABEL, WEEKDAY_LABEL } from "@/lib/format";
import type { WorkoutDetail } from "@/lib/types";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { Badge, Button, Card, ErrorBanner, PageHeader, Spinner } from "@/components/ui";

export default function TreinoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, loading, reload } = useFetch(() => api.get<WorkoutDetail>(`/workouts/${id}`), [id]);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      after?.();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Treino não encontrado."} />;

  if (editing && !data.readOnly) {
    return (
      <>
        <PageHeader eyebrow="Editar" title={data.name} />
        <WorkoutEditor
          initial={data}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
        <button type="button" onClick={() => setEditing(false)} className="mt-3 w-full py-2 text-sm underline">
          Cancelar edição
        </button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={data.archived ? "Treino arquivado" : data.readOnly ? "Somente leitura" : "Treino"}
        title={data.name}
        action={data.archived ? <Badge tone="neutral">Arquivado</Badge> : undefined}
      />
      <div className="flex flex-col gap-4">
        <ErrorBanner message={actionError} />
        {data.days.map((day) => (
          <section key={day.weekday} className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-semibold">{WEEKDAY_LABEL[day.weekday]}</h2>
            {[...day.items]
              .sort((a, b) => a.order - b.order)
              .map((it) => (
                <Card key={it.id}>
                  <p className="text-[17px] font-bold">{it.exercise.name}</p>
                  <p className="text-sm text-muted">
                    {it.sets} séries · {it.targetReps} reps · {MUSCLE_LABEL[it.exercise.muscleGroup]}
                    {it.restSeconds ? ` · ${it.restSeconds}s de descanso` : ""}
                  </p>
                  {it.notes && <p className="mt-1 text-sm">{it.notes}</p>}
                </Card>
              ))}
          </section>
        ))}

        {!data.readOnly && (
          <Button variant="dark" full onClick={() => setEditing(true)}>
            Editar treino
          </Button>
        )}
        {data.archived ? (
          <Button variant="outline" full disabled={busy} onClick={() => run(() => api.patch(`/workouts/${id}/unarchive`), reload)}>
            Desarquivar
          </Button>
        ) : (
          !data.readOnly && (
            <Button
              variant="outline"
              full
              disabled={busy}
              onClick={() => {
                if (window.confirm("Arquivar este treino? Ele deixa de aparecer no dia a dia, mas o histórico é mantido.")) {
                  void run(() => api.patch(`/workouts/${id}/archive`), () => router.replace("/treinos"));
                }
              }}
            >
              Arquivar
            </Button>
          )
        )}
        {!data.readOnly && (
          <Button
            variant="danger"
            full
            disabled={busy}
            onClick={() => {
              if (window.confirm("Excluir este treino definitivamente?")) {
                void run(() => api.del(`/workouts/${id}`), () => router.replace("/treinos"));
              }
            }}
          >
            Excluir
          </Button>
        )}
      </div>
    </>
  );
}
