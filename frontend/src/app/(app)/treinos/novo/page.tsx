"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { EmptyState, LinkButton, PageHeader, Spinner } from "@/components/ui";

function Content() {
  const { user } = useAuth();
  const studentId = useSearchParams().get("studentId") ?? undefined;

  if (user?.role === "PERSONAL" && !studentId) {
    return (
      <EmptyState
        title="Escolha um aluno primeiro"
        text="O treino é criado para um aluno específico."
        action={<LinkButton href="/treinos">Ir para treinos</LinkButton>}
      />
    );
  }
  if (user?.role === "STUDENT" && user.personal) {
    return (
      <EmptyState
        title="Treinos gerenciados pelo seu personal"
        text="Enquanto você estiver vinculado, é ele quem monta e edita seus treinos."
        action={<LinkButton href="/treinos">Voltar</LinkButton>}
      />
    );
  }
  return <WorkoutEditor studentId={studentId} />;
}

export default function NovoTreinoPage() {
  return (
    <>
      <PageHeader eyebrow="Planejamento" title="Novo treino" />
      <Suspense fallback={<Spinner />}>
        <Content />
      </Suspense>
    </>
  );
}
