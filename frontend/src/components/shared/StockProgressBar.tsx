import { cn } from "@/lib/utils";

interface StockProgressBarProps {
  stockQty: number;
  minThreshold: number;
  className?: string;
}

/**
 * Visualizes stock relative to 2x the minimum threshold (a comfortable
 * restock target), so the bar has headroom above "at threshold" rather
 * than maxing out exactly at the reorder point.
 */
export function StockProgressBar({ stockQty, minThreshold, className }: StockProgressBarProps) {
  const target = Math.max(minThreshold * 2, minThreshold + 1, 1);
  const pct = Math.max(0, Math.min(100, (stockQty / target) * 100));
  const ratio = minThreshold > 0 ? stockQty / minThreshold : stockQty > 0 ? Infinity : 0;

  const color = ratio <= 0 ? "bg-[var(--viz-critical)]" : ratio <= 1 ? "bg-[var(--viz-serious)]" : ratio <= 1.5 ? "bg-[var(--viz-warning)]" : "bg-[var(--viz-good)]";

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
