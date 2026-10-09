import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <p className="font-display text-5xl font-bold tracking-wide">
        REPZ<span className="text-accent [text-shadow:0_0_0_#14171A] [-webkit-text-stroke:1px_#14171A]">.</span>
      </p>
      <h1 className="mt-8 font-display text-3xl font-semibold">{title}</h1>
      <p className="mb-6 mt-1 text-[15px] text-muted">{subtitle}</p>
      {children}
    </main>
  );
}
