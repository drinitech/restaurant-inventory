"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { SpendTrendPoint } from "@/hooks/useReports";

function formatDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{label ? new Date(`${label}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</p>
      <p className="font-medium tabular-nums">€{payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export function WeeklySpendChart({ data, loading }: { data?: SpendTrendPoint[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  const chartData = (data ?? []).map((d) => ({ date: d.date, spend: Number(d.spend) }));
  const hasData = chartData.some((d) => d.spend > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No incoming-stock purchases recorded yet this period.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--viz-gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: "var(--viz-ink-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--viz-baseline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--viz-ink-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--viz-baseline)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="var(--viz-series-1)"
            strokeWidth={2}
            fill="url(#spendFill)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
