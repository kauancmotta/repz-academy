"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage, fieldErrorsFrom } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { MUSCLE_GROUPS, MUSCLE_LABEL } from "@/lib/format";
import type { Exercise, MuscleGroup } from "@/lib/types";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Input, Modal, PageHeader, Select, Spinner, Textarea } from "@/components/ui";

interface FormState {
  id: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
  videoUrl: string;
}

const EMPTY: FormState = { id: null, name: "", muscleGroup: "CHEST", description: "", videoUrl: "" };

export default function ExerciciosPage() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");
  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, error, loading, reload } = useFetch(
    () => api.get<Exercise[]>("/exercises", { q: q.trim() || undefined, muscleGroup: group || undefined }),
    [q, group],
  );

  function openEdit(ex: Exercise) {
    setForm({ id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, description: ex.description ?? "", videoUrl: ex.videoUrl ?? "" });
    setFieldErr({});
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setFormError(null);
    setFieldErr({});
    const body = {
      name: form.name.trim(),
      muscleGroup: form.muscleGroup,
      description: form.description.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
    };
    try {
      if (form.id) await api.patch(`/exercises/${form.id}`, body);
      else await api.post("/exercises", body);
      setForm(null);
      reload();
    } catch (e) {
      setFieldErr(fieldErrorsFrom(e));
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(ex: Exercise) {
    if (!window.confirm(`Excluir "${ex.name}"?`)) return;
    setPageError(null);
    try {
      await api.del(`/exercises/${ex.id}`);
      reload();
    } catch (e) {
      setPageError(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Exercícios"
        action={
          <Button
            variant="dark"
            className="!h-10 !px-4 text-sm"
            onClick={() => {
              setForm(EMPTY);
              setFieldErr({});
              setFormError(null);
            }}
          >
            Novo
          </Button>
        }
      />
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Buscar" htmlFor="busca">
            <Input id="busca" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome do exercício" />
          </Field>
          <Field label="Grupo muscular" htmlFor="grupo">
            <Select id="grupo" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup | "")}>
              <option value="">Todos</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {MUSCLE_LABEL[g]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <ErrorBanner message={error ?? pageError} />
        {loading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="Nenhum exercício encontrado" text="Ajuste os filtros ou crie um exercício seu." />
        ) : (
          data?.map((ex) => (
            <Card key={ex.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold">{ex.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {MUSCLE_LABEL[ex.muscleGroup]}
                  {ex.isGlobal && <Badge tone="neutral">Padrão</Badge>}
                </p>
              </div>
              {!ex.isGlobal && (
                <div className="flex gap-3 text-sm">
                  <button type="button" className="underline" onClick={() => openEdit(ex)}>
                    Editar
                  </button>
                  <button type="button" className="text-danger underline" onClick={() => remove(ex)}>
                    Excluir
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {form && (
        <Modal title={form.id ? "Editar exercício" : "Novo exercício"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="flex flex-col gap-3" noValidate>
            <ErrorBanner message={formError} />
            <Field label="Nome" htmlFor="ex-nome" error={fieldErr.name}>
              <Input id="ex-nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Grupo muscular" htmlFor="ex-grupo" error={fieldErr.muscleGroup}>
              <Select id="ex-grupo" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value as MuscleGroup })}>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {MUSCLE_LABEL[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição (opcional)" htmlFor="ex-desc" error={fieldErr.description}>
              <Textarea id="ex-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Link do vídeo (YouTube, opcional)" htmlFor="ex-video" error={fieldErr.videoUrl}>
              <Input id="ex-video" inputMode="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
            </Field>
            <Button type="submit" variant="dark" full disabled={busy}>
              {busy ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
