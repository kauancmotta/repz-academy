"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFetch } from "@/lib/useFetch";
import { WEEKDAY_LABEL, MUSCLE_LABEL } from "@/lib/format";
import type { SessionView, TodayWorkouts } from "@/lib/types";
import { Button, Card, EmptyState, ErrorBanner, LinkButton, PageHeader, Spinner } from "@/components/ui";

export default function HojePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const today = useFetch(() => api.get<TodayWorkouts>("/workouts/today"), []);
  const current = useFetch(async () => {
    try {
      return await api.get<SessionView>("/sessions/current");
    } catch (e) {
      if (e instanceof ApiError && e.code === "NO_ACTIVE_SESSION") return null;
      throw e;
    }
  }, []);

  async function start(workoutId: string) {
    if (!today.data) return;
    setActionError(null);
    setStarting(workoutId);
    try {
      await api.post("/sessions", { workoutId, weekday: today.data.weekday });
      router.push("/sessao");
    } catch (e) {
      if (e instanceof ApiError && e.code === "SESSION_IN_PROGRESS") {
        router.push("/sessao");
        return;
      }
      setActionError(errorMessage(e));
      setStarting(null);
    }
  }

  if (today.loading || current.loading) return <Spinner />;

  const workouts = today.data?.workouts ?? [];
  const weekday = today.data ? WEEKDAY_LABEL[today.data.weekday] : "Hoje";

  return (
    <>
      <PageHeader eyebrow={weekday} title="Treino de hoje" />
      <div className="flex flex-col gap-4">
        <ErrorBanner message={today.error ?? current.error ?? actionError} />

        {current.data && (
          <Card className="flex flex-col gap-3 !border-ink !bg-ink text-bg">
            <div>
              <p className="text-[13px] text-soft">Treino em andamento</p>
              <p className="font-display text-2xl font-semibold">{current.data.workoutName}</p>
            </div>
            <LinkButton href="/sessao" variant="primary" full>
              Continuar treino
            </LinkButton>
          </Card>
        )}

        {!today.error && workouts.length === 0 && (
          <EmptyState
            title="Nenhum treino para hoje"
            text={
              user?.personal
                ? "Seu personal ainda não montou treino para este dia."
                : "Monte um treino para começar a registrar suas séries."
            }
            action={
              user?.personal ? undefined : (
                <LinkButton href="/treinos/novo" variant="dark">
                  Criar treino
                </LinkButton>
              )
            }
          />
        )}

        {workouts.map((workout) => (
          <section key={workout.id} className="flex flex-col gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">{workout.name}</h2>
              <p className="text-[15px] text-muted">{workout.items.length} exercícios</p>
            </div>
            {workout.items.map((item) => (
              <Card key={item.id}>
                <p className="text-[17px] font-bold">{item.exercise.name}</p>
                <p className="text-sm text-muted">
                  {item.sets} séries · {item.targetReps} reps · {MUSCLE_LABEL[item.exercise.muscleGroup]}
                  {item.restSeconds ? ` · ${item.restSeconds}s de descanso` : ""}
                </p>
                {item.notes && <p className="mt-1 text-sm">{item.notes}</p>}
              </Card>
            ))}
            {!current.data && (
              <Button variant="dark" full onClick={() => start(workout.id)} disabled={starting !== null}>
                {starting === workout.id ? "Iniciando..." : "Iniciar treino"}
              </Button>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
