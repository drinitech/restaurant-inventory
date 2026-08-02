"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { IngredientUsagePoint } from "@/hooks/useReports";

function CustomTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{label ? new Date(label).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</p>
      <p className="font-medium tabular-nums">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export function UsageTrendChart({ data, loading, unit }: { data?: IngredientUsagePoint[]; loading?: boolean; unit: string }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No usage recorded for this ingredient yet.</div>;
  }

  const chartData = data.map((d) => ({ date: d.date, quantity: Number(d.quantity) }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--viz-gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            tick={{ fill: "var(--viz-ink-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--viz-baseline)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis tick={{ fill: "var(--viz-ink-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: "var(--viz-baseline)", strokeWidth: 1 }} />
          <Line type="monotone" dataKey="quantity" stroke="var(--viz-series-3)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
