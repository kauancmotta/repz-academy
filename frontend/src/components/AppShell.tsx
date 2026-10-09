"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Me } from "@/lib/types";

const NAV = {
  STUDENT: [
    { href: "/hoje", label: "Hoje" },
    { href: "/treinos", label: "Treinos" },
    { href: "/evolucao", label: "Evolução" },
  ],
  PERSONAL: [
    { href: "/alunos", label: "Alunos" },
    { href: "/treinos", label: "Treinos" },
    { href: "/exercicios", label: "Exercícios" },
  ],
} as const;

export function AppShell({ user, children }: { user: Me; children: ReactNode }) {
  const pathname = usePathname();
  const items = NAV[user.role];
  // Durante a execução do treino a navegação inferior some para evitar saídas acidentais.
  const focusMode = pathname.startsWith("/sessao");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <div className="flex items-center justify-between px-6 pt-4">
        <Link href="/" className="font-display text-xl font-bold tracking-wide">
          REPZ
        </Link>
        <Link href="/conta" className="text-sm text-muted underline-offset-2 hover:underline">
          {user.name.split(" ")[0]} · Conta
        </Link>
      </div>
      <main className={`flex-1 px-6 pt-3 ${focusMode ? "pb-8" : "pb-28"}`}>{children}</main>
      {!focusMode && (
        <nav
          aria-label="Navegação principal"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white"
        >
          <div className="mx-auto flex max-w-2xl pb-3 pt-2">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 py-2.5 text-center text-sm ${active ? "font-bold text-ink" : "text-muted"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
