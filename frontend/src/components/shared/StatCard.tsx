import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "warning" | "critical";
}

const TONE_ICON: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-[var(--viz-warning)]/20 text-[var(--viz-warning)]",
  critical: "bg-[var(--viz-critical)]/15 text-[var(--viz-critical)]",
};

export function StatCard({ label, value, icon: Icon, hint, loading, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", TONE_ICON[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}
