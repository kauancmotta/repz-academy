"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage, fieldErrorsFrom } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { MUSCLE_LABEL, WEEKDAYS, WEEKDAY_LABEL, WEEKDAY_SHORT } from "@/lib/format";
import type { Exercise, Weekday, WorkoutDetail, WorkoutInput } from "@/lib/types";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Select, Spinner } from "@/components/ui";

interface DraftItem {
  key: string;
  exerciseId: string;
  weekday: Weekday;
  sets: string;
  targetReps: string;
  restSeconds: string;
  notes: string;
}

let counter = 0;
const newKey = () => `i${++counter}`;

function fromDetail(detail: WorkoutDetail): DraftItem[] {
  return detail.days.flatMap((day) =>
    [...day.items]
      .sort((a, b) => a.order - b.order)
      .map((it) => ({
        key: newKey(),
        exerciseId: it.exercise.id,
        weekday: day.weekday,
        sets: String(it.sets),
        targetReps: String(it.targetReps),
        restSeconds: it.restSeconds === null ? "" : String(it.restSeconds),
        notes: it.notes ?? "",
      })),
  );
}

interface Props {
  initial?: WorkoutDetail;
  /** Obrigatório quando o personal cria um treino para um aluno. */
  studentId?: string;
  /** Chamado após salvar uma edição (a tela de detalhe volta ao modo leitura). */
  onSaved?: () => void;
}

export function WorkoutEditor({ initial, studentId, onSaved }: Props) {
  const router = useRouter();
  const exercises = useFetch(() => api.get<Exercise[]>("/exercises"), []);
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<DraftItem[]>(initial ? fromDetail(initial) : []);
  const [day, setDay] = useState<Weekday>(initial?.days[0]?.weekday ?? "MONDAY");
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const byId = useMemo(() => new Map((exercises.data ?? []).map((e) => [e.id, e])), [exercises.data]);
  const dayItems = items.filter((i) => i.weekday === day);
  const countOf = (d: Weekday) => items.filter((i) => i.weekday === d).length;

  function update(key: string, patch: Partial<DraftItem>) {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function add() {
    if (!pick) return;
    setItems((list) => [
      ...list,
      { key: newKey(), exerciseId: pick, weekday: day, sets: "3", targetReps: "10", restSeconds: "60", notes: "" },
    ]);
    setPick("");
  }

  function move(key: string, direction: -1 | 1) {
    setItems((list) => {
      const inDay = list.filter((i) => i.weekday === day);
      const pos = inDay.findIndex((i) => i.key === key);
      const target = inDay[pos + direction];
      if (pos < 0 || !target) return list;
      const next = [...list];
      const a = next.findIndex((i) => i.key === key);
      const b = next.findIndex((i) => i.key === target.key);
      [next[a], next[b]] = [next[b]!, next[a]!];
      return next;
    });
  }

  function remove(key: string) {
    setItems((list) => list.filter((i) => i.key !== key));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErr({});

    if (items.length === 0) {
      setError("Adicione ao menos um exercício ao treino.");
      return;
    }
    const orderPerDay = new Map<Weekday, number>();
    const payloadItems: WorkoutInput["items"] = [];
    for (const it of items) {
      const sets = Number(it.sets);
      const reps = Number(it.targetReps);
      const rest = it.restSeconds.trim() === "" ? null : Number(it.restSeconds);
      if (!Number.isInteger(sets) || !Number.isInteger(reps) || (rest !== null && !Number.isInteger(rest))) {
        setError("Séries, repetições e descanso devem ser números inteiros.");
        return;
      }
      const order = (orderPerDay.get(it.weekday) ?? 0) + 1;
      orderPerDay.set(it.weekday, order);
      payloadItems.push({
        exerciseId: it.exerciseId,
        weekday: it.weekday,
        order,
        sets,
        targetReps: reps,
        restSeconds: rest,
        notes: it.notes.trim() || null,
      });
    }

    setBusy(true);
    try {
      if (initial) {
        await api.put<WorkoutDetail>(`/workouts/${initial.id}`, { name: name.trim(), items: payloadItems });
        onSaved?.();
        setBusy(false);
      } else {
        const created = await api.post<WorkoutDetail>("/workouts", {
          name: name.trim(),
          ...(studentId ? { studentId } : {}),
          items: payloadItems,
        });
        router.replace(`/treinos/${created.id}`);
      }
    } catch (e) {
      setFieldErr(fieldErrorsFrom(e));
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (exercises.loading) return <Spinner />;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <ErrorBanner message={error ?? exercises.error} />
      <Field label="Nome do treino" htmlFor="wk-nome" error={fieldErr.name}>
        <Input id="wk-nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Hipertrofia ABC" />
      </Field>

      <div role="tablist" aria-label="Dia da semana" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
        {WEEKDAYS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={day === d}
            onClick={() => setDay(d)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
              day === d ? "border-ink bg-ink text-accent" : "border-line bg-white text-muted"
            }`}
          >
            {WEEKDAY_SHORT[d]}
            {countOf(d) > 0 && <span className="ml-1.5 text-xs">({countOf(d)})</span>}
          </button>
        ))}
      </div>

      <h2 className="font-display text-2xl font-semibold">{WEEKDAY_LABEL[day]}</h2>

      {dayItems.length === 0 ? (
        <EmptyState title="Nenhum exercício neste dia" text="Escolha um exercício abaixo para adicionar." />
      ) : (
        dayItems.map((it, idx) => {
          const ex = byId.get(it.exerciseId);
          return (
            <Card key={it.key} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[17px] font-bold">
                    {idx + 1}. {ex?.name ?? "Exercício"}
                  </p>
                  {ex && <p className="text-sm text-muted">{MUSCLE_LABEL[ex.muscleGroup]}</p>}
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button type="button" onClick={() => move(it.key, -1)} disabled={idx === 0} aria-label="Mover para cima" className="disabled:opacity-30">
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.key, 1)}
                    disabled={idx === dayItems.length - 1}
                    aria-label="Mover para baixo"
                    className="disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => remove(it.key)} className="text-danger underline">
                    Remover
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Séries" htmlFor={`s-${it.key}`}>
                  <Input id={`s-${it.key}`} inputMode="numeric" value={it.sets} onChange={(e) => update(it.key, { sets: e.target.value.replace(/\D/g, "") })} />
                </Field>
                <Field label="Reps" htmlFor={`r-${it.key}`}>
                  <Input id={`r-${it.key}`} inputMode="numeric" value={it.targetReps} onChange={(e) => update(it.key, { targetReps: e.target.value.replace(/\D/g, "") })} />
                </Field>
                <Field label="Descanso (s)" htmlFor={`d-${it.key}`}>
                  <Input id={`d-${it.key}`} inputMode="numeric" value={it.restSeconds} onChange={(e) => update(it.key, { restSeconds: e.target.value.replace(/\D/g, "") })} />
                </Field>
              </div>
              <Field label="Observação (opcional)" htmlFor={`n-${it.key}`}>
                <Input id={`n-${it.key}`} value={it.notes} maxLength={300} onChange={(e) => update(it.key, { notes: e.target.value })} />
              </Field>
            </Card>
          );
        })
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Adicionar exercício" htmlFor="wk-add">
            <Select id="wk-add" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Selecione...</option>
              {(exercises.data ?? []).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({MUSCLE_LABEL[ex.muscleGroup]})
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button variant="outline" onClick={add} disabled={!pick}>
          Adicionar
        </Button>
      </div>

      <Button type="submit" variant="dark" full disabled={busy}>
        {busy ? "Salvando..." : initial ? "Salvar alterações" : "Criar treino"}
      </Button>
    </form>
  );
}
