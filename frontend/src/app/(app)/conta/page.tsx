"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from "@/components/ui";

export default function ContaPage() {
  const { user, logout, refresh } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function redeem(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await api.post<{ personal: { name: string } }>("/invites/redeem", { code: code.trim().toUpperCase() });
      await refresh();
      setCode("");
      setNotice(`Pronto! Agora você treina com ${res.personal.name}.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm("Desvincular do seu personal? Você mantém seu histórico, mas os treinos dele ficam arquivados e somente leitura.")) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api.del("/link");
      await refresh();
      setNotice("Vínculo removido.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow={user.role === "PERSONAL" ? "Personal" : "Aluno"} title="Minha conta" />
      <div className="flex flex-col gap-4">
        <ErrorBanner message={error} />
        {notice && <div role="status" className="rounded-xl bg-accent px-4 py-3 text-sm font-bold">{notice}</div>}

        <Card>
          <p className="text-lg font-bold">{user.name}</p>
          <p className="text-sm text-muted">{user.email}</p>
        </Card>

        {user.role === "STUDENT" && user.personal && (
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-[13px] text-muted">Seu personal</p>
              <p className="text-lg font-bold">{user.personal.name}</p>
            </div>
            <Button variant="danger" onClick={unlink} disabled={busy}>
              Desvincular
            </Button>
          </Card>
        )}

        {user.role === "STUDENT" && !user.personal && (
          <Card>
            <form onSubmit={redeem} className="flex flex-col gap-3">
              <div>
                <p className="text-[15px] font-bold">Tem um código de convite?</p>
                <p className="text-sm text-muted">Informe o código de 8 caracteres que seu personal enviou.</p>
              </div>
              <Field label="Código do convite" htmlFor="code">
                <Input
                  id="code"
                  value={code}
                  maxLength={8}
                  autoCapitalize="characters"
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-display text-xl tracking-[0.3em]"
                />
              </Field>
              <Button type="submit" variant="dark" disabled={busy || code.trim().length < 8}>
                Vincular ao personal
              </Button>
            </form>
          </Card>
        )}

        <Button variant="outline" onClick={logout}>
          Sair
        </Button>
      </div>
    </>
  );
}
