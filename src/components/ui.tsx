import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 p-5">
      <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function Empty({ text = "Henüz eklenmedi." }: { text?: string }) {
  return <p className="text-sm text-neutral-500">{text}</p>;
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
      {children}
    </li>
  );
}
