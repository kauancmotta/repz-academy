"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage, fieldErrorsFrom } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { AuthLayout } from "@/components/AuthCard";
import { Button, ErrorBanner, Field, Input } from "@/components/ui";

const ROLES: { value: Role; title: string; text: string }[] = [
  { value: "STUDENT", title: "Sou aluno", text: "Registro meus treinos e acompanho minha evolução." },
  { value: "PERSONAL", title: "Sou personal", text: "Monto treinos e acompanho meus alunos." },
];

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [user, loading, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const me = await register({ name: name.trim(), email: email.trim(), password, role });
      router.replace(homeFor(me.role));
    } catch (e) {
      setFieldErrors(fieldErrorsFrom(e));
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Leva menos de um minuto.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <ErrorBanner message={error} />
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Tipo de conta</legend>
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-2xl border-2 p-3 ${role === r.value ? "border-ink bg-white" : "border-line bg-white/60"}`}
            >
              <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
              <span className="block text-[15px] font-bold">{r.title}</span>
              <span className="mt-1 block text-[13px] leading-snug text-muted">{r.text}</span>
            </label>
          ))}
        </fieldset>
        <Field label="Nome" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="E-mail" htmlFor="email" error={fieldErrors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha (mínimo 8 caracteres)" htmlFor="password" error={fieldErrors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" variant="dark" full disabled={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold text-ink underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
