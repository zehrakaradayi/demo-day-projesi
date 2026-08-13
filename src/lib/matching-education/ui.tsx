import type { ReactNode } from "react";

/** Bu feature'a özel küçük, paylaşılan olmayan sunum bileşenleri (src/components/ değil). */

export function PageHeader({
  briefSection,
  title,
  description,
}: {
  briefSection: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-violet-600">{briefSection}</span>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "violet" | "green" | "amber";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    violet: "bg-violet-100 text-violet-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
      {children}
    </p>
  );
}

export const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondaryClass =
  "inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:border-violet-500 hover:text-violet-600";
