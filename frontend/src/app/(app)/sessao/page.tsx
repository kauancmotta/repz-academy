"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage, fieldErrorsFrom } from "@/lib/api";
import { formatKg, MUSCLE_LABEL, parseDecimal } from "@/lib/format";
import type { LoggedSet, SessionItem, SessionSummary, SessionView } from "@/lib/types";
import { Button, Card, ErrorBanner, Field, Input, Spinner } from "@/components/ui";

function nextSetNumber(item: SessionItem): number {
  const used = new Set(item.loggedSets.map((s) => s.setNumber));
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

function suggestion(item: SessionItem, setNumber: number): { weight: string; reps: string } {
  const lastLogged = [...item.loggedSets].sort((a, b) => b.setNumber - a.setNumber)[0];
  const perf = item.lastPerformance?.sets ?? [];
  const fromHistory = perf.find((s) => s.setNumber === setNumber) ?? perf[perf.length - 1];
  const source = lastLogged ?? fromHistory;
  return {
    weight: source ? String(source.weightKg).replace(".", ",") : "",
    reps: source ? String(source.reps) : String(item.targetReps),
  };
}

function useElapsed(startedAt: string | undefined): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!startedAt) return "0 min";
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
  return `${minutes} min`;
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);
  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);
  const mm = Math.max(0, Math.floor(left / 60));
  const ss = String(Math.max(0, left % 60)).padStart(2, "0");
  return (
    <div role="timer" className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-bg">
      <span className="text-sm text-soft">Descanso</span>
      <span className="font-display text-2xl font-semibold text-accent">
        {mm}:{ss}
      </span>
      <button type="button" onClick={onDone} className="text-sm underline">
        Pular
      </button>
    </div>
  );
}

export default function SessaoPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [editing, setEditing] = useState<LoggedSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const initialized = useRef(false);
  const elapsed = useElapsed(session?.startedAt);

  const load = useCallback(async () => {
    try {
      const s = await api.get<SessionView>("/sessions/current");
      setSession(s);
      if (!initialized.current) {
        initialized.current = true;
        const firstOpen = s.items.findIndex((it) => it.loggedSets.length < it.sets);
        setIdx(firstOpen === -1 ? 0 : firstOpen);
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "NO_ACTIVE_SESSION") {
        router.replace("/hoje");
        return;
      }
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const item = session?.items[idx];
  const setNumber = item ? (editing ? editing.setNumber : nextSetNumber(item)) : 1;

  // Preenche o formulário ao trocar de exercício / depois de registrar uma série.
  const itemId = item?.id;
  const loggedCount = item?.loggedSets.length ?? 0;
  useEffect(() => {
    if (!item || editing) return;
    const s = suggestion(item, nextSetNumber(item));
    setWeight(s.weight);
    setReps(s.reps);
    setFieldErr({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, loggedCount, editing]);

  useEffect(() => {
    setShowVideo(false);
    setEditing(null);
  }, [idx]);

  const totalLogged = useMemo(() => session?.items.reduce((acc, it) => acc + it.loggedSets.length, 0) ?? 0, [session]);

  if (loading) return <Spinner />;
  if (!session || !item) return <ErrorBanner message={error ?? "Treino não encontrado."} />;

  const current = session;
  const currentItem = item;
  const doneInItem = currentItem.loggedSets.length;
  const isExtra = !editing && doneInItem >= currentItem.sets;

  async function submitSet(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErr({});
    const w = parseDecimal(weight);
    const r = Number(reps);
    if (w === null) {
      setFieldErr({ weightKg: "Informe a carga em kg (use até 2 casas decimais)." });
      return;
    }
    if (!Number.isInteger(r) || r < 1) {
      setFieldErr({ reps: "Informe ao menos 1 repetição." });
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/sessions/${current.id}/sets/${editing.id}`, { weightKg: w, reps: r });
        setEditing(null);
      } else {
        await api.post(`/sessions/${current.id}/sets`, {
          workoutItemId: currentItem.id,
          setNumber,
          weightKg: w,
          reps: r,
        });
        if (currentItem.restSeconds) setRest(currentItem.restSeconds);
      }
      await load();
    } catch (e) {
      setFieldErr(fieldErrorsFrom(e));
      setError(errorMessage(e));
      if (e instanceof ApiError && e.code === "SET_ALREADY_LOGGED") await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeSet(set: LoggedSet) {
    setError(null);
    setBusy(true);
    try {
      await api.del(`/sessions/${current.id}/sets/${set.id}`);
      if (editing?.id === set.id) setEditing(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(set: LoggedSet) {
    setEditing(set);
    setWeight(String(set.weightKg).replace(".", ","));
    setReps(String(set.reps));
    setFieldErr({});
  }

  async function finish() {
    setError(null);
    if (!window.confirm("Finalizar o treino agora?")) return;
    setBusy(true);
    try {
      const summary = await api.post<SessionSummary>(`/sessions/${current.id}/finish`);
      router.replace(`/resumo/${summary.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancelar o treino? As séries registradas nesta sessão serão descartadas.")) return;
    setBusy(true);
    try {
      await api.del(`/sessions/${current.id}`);
      router.replace("/hoje");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  const progress = Math.round(((idx + 1) / current.items.length) * 100);
  const lastPerf = currentItem.lastPerformance?.sets ?? [];
  const lastBest = lastPerf.length ? lastPerf.reduce((a, b) => (b.weightKg > a.weightKg ? b : a)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex justify-between text-sm text-muted">
          <span>
            Exercício {idx + 1} de {current.items.length}
          </span>
          <span>Em andamento · {elapsed}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight">{currentItem.exercise.name}</h1>
        <p className="text-sm text-muted">
          {MUSCLE_LABEL[currentItem.exercise.muscleGroup]} · meta {currentItem.sets} × {currentItem.targetReps}
        </p>
        <div className="h-1.5 rounded bg-line" aria-hidden>
          <div className="h-1.5 rounded bg-ink" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ErrorBanner message={error} />

      {currentItem.exercise.videoEmbedUrl && (
        <div>
          <button type="button" className="text-sm font-bold underline" onClick={() => setShowVideo((v) => !v)}>
            {showVideo ? "Ocultar vídeo" : "Ver vídeo do exercício"}
          </button>
          {showVideo && (
            <div className="mt-2 aspect-video overflow-hidden rounded-2xl">
              <iframe
                src={currentItem.exercise.videoEmbedUrl}
                title={`Vídeo: ${currentItem.exercise.name}`}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {currentItem.notes && <p className="rounded-xl bg-white px-4 py-3 text-sm">{currentItem.notes}</p>}

      {lastBest && (
        <div className="flex flex-col gap-1 rounded-2xl bg-ink p-4 text-bg">
          <span className="text-[13px] text-soft">Da última vez</span>
          <span className="text-xl font-bold text-accent">
            {formatKg(lastBest.weightKg)} × {lastBest.reps} reps
          </span>
        </div>
      )}

      {rest !== null && <RestTimer seconds={rest} onDone={() => setRest(null)} />}

      <ul className="flex flex-col gap-2">
        {[...currentItem.loggedSets]
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((set) => (
            <li
              key={set.id}
              className={`flex items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 ${
                editing?.id === set.id ? "border-ink" : "border-line"
              }`}
            >
              <span>Série {set.setNumber}</span>
              <span className="font-bold">
                {formatKg(set.weightKg)} × {set.reps}
              </span>
              <span className="flex gap-3 text-sm">
                <button type="button" className="underline" onClick={() => startEdit(set)} disabled={busy}>
                  Editar
                </button>
                <button type="button" className="text-danger underline" onClick={() => removeSet(set)} disabled={busy}>
                  Excluir
                </button>
              </span>
            </li>
          ))}
      </ul>

      <form onSubmit={submitSet} className="flex flex-col gap-3.5 rounded-2xl border-2 border-ink bg-white p-4" noValidate>
        <p className="text-base font-bold">
          {editing ? `Corrigir série ${editing.setNumber}` : isExtra ? `Série extra (${setNumber})` : `Série ${setNumber} de ${currentItem.sets}`}
        </p>
        <div className="flex gap-3">
          <Field label="Carga (kg)" htmlFor="carga" error={fieldErr.weightKg}>
            <Input
              id="carga"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="!h-[52px] text-[22px] font-bold"
            />
          </Field>
          <Field label="Repetições" htmlFor="reps" error={fieldErr.reps}>
            <Input
              id="reps"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value.replace(/\D/g, ""))}
              className="!h-[52px] text-[22px] font-bold"
            />
          </Field>
        </div>
        <div className="flex gap-3">
          <Button type="submit" full disabled={busy} className="!h-[52px] text-[17px]">
            {editing ? "Salvar correção" : "Registrar série"}
          </Button>
          {editing && (
            <Button variant="outline" onClick={() => setEditing(null)} className="!h-[52px]">
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="flex gap-3">
        <Button variant="outline" full onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          Anterior
        </Button>
        {idx < current.items.length - 1 ? (
          <Button variant="outline" full onClick={() => setIdx((i) => i + 1)}>
            Próximo
          </Button>
        ) : (
          <Button variant="dark" full onClick={finish} disabled={busy || totalLogged === 0}>
            Finalizar treino
          </Button>
        )}
      </div>

      {idx < current.items.length - 1 && totalLogged > 0 && (
        <Button variant="dark" full onClick={finish} disabled={busy}>
          Finalizar treino
        </Button>
      )}
      <button type="button" onClick={cancel} disabled={busy} className="py-2 text-sm text-danger underline">
        Cancelar treino
      </button>
    </div>
  );
}
