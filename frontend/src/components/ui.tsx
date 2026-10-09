import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Variant = "primary" | "dark" | "outline" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-ink",
  dark: "bg-ink text-accent",
  outline: "border border-line bg-white text-ink",
  danger: "bg-dangerbg text-danger",
  ghost: "text-muted",
};

function buttonClass(variant: Variant, full: boolean, extra = ""): string {
  return `inline-flex h-12 items-center justify-center rounded-xl px-5 text-base font-bold transition active:scale-[0.98] disabled:opacity-50 ${
    full ? "w-full" : ""
  } ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  full = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; full?: boolean }) {
  return <button type="button" {...props} className={buttonClass(variant, full, className)} />;
}

export function LinkButton({
  href,
  variant = "primary",
  full = false,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, full, className)}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 pb-5 pt-2">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl bg-dangerbg px-4 py-3 text-sm font-medium text-danger">
      {message}
    </div>
  );
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div role="status" className="py-10 text-center text-sm text-muted">
      {label}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center">
      <p className="text-base font-bold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "danger" | "neutral" }) {
  const tones = {
    accent: "bg-accent text-ink",
    danger: "bg-dangerbg text-danger",
    neutral: "bg-line text-ink",
  };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-bold ${tones[tone]}`}>{children}</span>;
}

const fieldClass =
  "h-12 w-full min-w-0 rounded-[10px] border border-line bg-bg px-3 text-base text-ink outline-none focus:border-ink";

export function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] text-muted">
        {label}
      </label>
      {children}
      {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} h-24 py-2 ${props.className ?? ""}`} />;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-bg p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="px-2 py-1 text-sm text-muted" aria-label="Fechar">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
