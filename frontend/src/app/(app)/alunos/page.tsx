"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFetch } from "@/lib/useFetch";
import { daysSince, firstName, formatDate, timeAgo } from "@/lib/format";
import type { Invite, InviteCreated, Student, StudentOverview } from "@/lib/types";
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Spinner } from "@/components/ui";

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-7 items-end gap-1.5" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[3px] ${v === 0 ? "bg-[#B9B8B0]" : "bg-ink"}`}
          style={{ height: v === 0 ? 3 : Math.max(8, Math.round((v / max) * 28)) }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ lastSessionAt }: { lastSessionAt: string | null }) {
  const days = daysSince(lastSessionAt);
  if (days === null) return <Badge tone="neutral">Sem treinos</Badge>;
  if (days <= 7) return <Badge>Em dia</Badge>;
  if (days < 14) return <Badge tone="neutral">Há {days} dias sem treinar</Badge>;
  return <Badge tone="danger">Parado há {Math.floor(days / 7)} semanas</Badge>;
}

function StudentCard({ student }: { student: Student }) {
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get<StudentOverview>(`/students/${student.id}/overview`)
      .then((o) => !cancelled && setOverview(o))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  return (
    <Link href={`/alunos/${student.id}`}>
      <Card className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-lg font-bold">{student.name}</span>
          <StatusBadge lastSessionAt={student.lastSessionAt} />
        </div>
        <p className="text-sm text-muted">Último treino: {timeAgo(student.lastSessionAt)}</p>
        {overview && overview.weeklyFrequency.length > 0 && (
          <>
            <MiniBars values={overview.weeklyFrequency.slice(-6).map((w) => w.sessions)} />
            <p className="text-[13px] text-muted">Treinos por semana, últimas {Math.min(6, overview.weeklyFrequency.length)} semanas</p>
          </>
        )}
      </Card>
    </Link>
  );
}

export default function AlunosPage() {
  const { user } = useAuth();
  const students = useFetch(() => api.get<Student[]>("/students"), []);
  const invites = useFetch(() => api.get<Invite[]>("/invites"), []);
  const [newInvite, setNewInvite] = useState<InviteCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      setNewInvite(await api.post<InviteCreated>("/invites"));
      setCopied(false);
      invites.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(id: string) {
    setError(null);
    try {
      await api.del(`/invites/${id}`);
      if (newInvite?.id === id) setNewInvite(null);
      invites.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const activeInvites = (invites.data ?? []).filter((i) => i.status === "ACTIVE");

  return (
    <>
      <PageHeader eyebrow={`Olá, ${user ? firstName(user.name) : ""}`} title="Meus alunos" />
      <div className="flex flex-col gap-3">
        <ErrorBanner message={students.error ?? error} />

        {students.loading ? (
          <Spinner />
        ) : (students.data ?? []).length === 0 ? (
          <EmptyState title="Nenhum aluno vinculado" text="Gere um convite abaixo e envie o código ao seu aluno." />
        ) : (
          students.data?.map((s) => <StudentCard key={s.id} student={s} />)
        )}

        <Card className="mt-2 flex flex-col gap-3 !border-ink !bg-ink text-bg">
          <div>
            <p className="text-[15px] font-bold">Convidar novo aluno</p>
            <p className="text-sm text-soft">Gere um código de 8 caracteres, uso único, válido por 7 dias.</p>
          </div>
          {newInvite && (
            <div className="rounded-xl bg-dark2 p-3 text-center">
              <p className="font-display text-4xl tracking-[0.3em] text-accent" data-testid="invite-code">
                {newInvite.code}
              </p>
              <p className="mt-1 text-[13px] text-soft">Válido até {formatDate(newInvite.expiresAt)}</p>
              <button type="button" onClick={() => copy(newInvite.code)} className="mt-2 text-sm underline">
                {copied ? "Código copiado!" : "Copiar código"}
              </button>
            </div>
          )}
          <Button onClick={generate} disabled={busy}>
            {busy ? "Gerando..." : "Gerar convite"}
          </Button>
        </Card>

        {activeInvites.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-xl font-semibold">Convites ativos</h2>
            {activeInvites.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl tracking-[0.25em]">{inv.code}</p>
                  <p className="text-[13px] text-muted">Expira em {formatDate(inv.expiresAt)}</p>
                </div>
                <button type="button" className="text-sm text-danger underline" onClick={() => cancelInvite(inv.id)}>
                  Cancelar
                </button>
              </Card>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
