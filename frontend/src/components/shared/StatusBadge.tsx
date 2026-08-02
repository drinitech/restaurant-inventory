import { cn } from "@/lib/utils";

type Status = "good" | "warning" | "serious" | "critical" | "neutral";

const STATUS_STYLES: Record<Status, string> = {
  good: "bg-[var(--viz-good)]/15 text-[var(--viz-good)] dark:text-[var(--viz-good)]",
  warning: "bg-[var(--viz-warning)]/20 text-amber-700 dark:text-[var(--viz-warning)]",
  serious: "bg-[var(--viz-serious)]/20 text-orange-700 dark:text-[var(--viz-serious)]",
  critical: "bg-[var(--viz-critical)]/15 text-[var(--viz-critical)]",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {children}
    </span>
  );
}
