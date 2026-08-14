import { cn } from "@/lib/utils";

export function RadialBackground() {
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 -z-10 size-full bg-white",
        "[background:radial-gradient(125%_125%_at_50%_0%,#fff_45%,#ede9fe_78%,#c4b5fd_100%)]",
      )}
    />
  );
}
