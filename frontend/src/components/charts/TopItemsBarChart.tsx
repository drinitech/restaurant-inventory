"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TopItemsBarChartProps {
  data?: { name: string; value: number }[];
  loading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

function CustomTooltip({ active, payload, valuePrefix = "", valueSuffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {valuePrefix}
        {payload[0].value.toFixed(2)}
        {valueSuffix}
      </p>
    </div>
  );
}

export function TopItemsBarChart({ data, loading, valuePrefix = "", valueSuffix = "" }: TopItemsBarChartProps) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>;
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div style={{ height: Math.max(180, sorted.length * 44) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--viz-gridline)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "var(--viz-ink-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} cursor={{ fill: "var(--viz-gridline)", opacity: 0.4 }} />
          <Bar dataKey="value" fill="var(--viz-series-1)" radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => `${valuePrefix}${Number(v ?? 0).toFixed(2)}${valueSuffix}`}
              fill="var(--viz-ink-primary)"
              fontSize={12}
            />
            {sorted.map((_, i) => (
              <Cell key={i} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
