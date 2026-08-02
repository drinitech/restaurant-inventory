"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Only the first 3 categorical slots validate all-pairs CVD separation (see dataviz
// skill references/palette.md) — a pie/donut compares every slice to every other
// slice at once, so we cap at 3 explicit categories and fold the rest into "Other".
const SLOT_COLORS = ["var(--viz-series-1)", "var(--viz-series-2)", "var(--viz-series-3)"];
const OTHER_COLOR = "var(--viz-ink-muted)";

interface CategoryDonutChartProps {
  data?: { name: string; value: number }[];
  loading?: boolean;
}

export function CategoryDonutChart({ data, loading }: CategoryDonutChartProps) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>;
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const otherTotal = rest.reduce((sum, d) => sum + d.value, 0);
  const chartData = otherTotal > 0 ? [...top3, { name: "Other", value: otherTotal }] : top3;
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="var(--viz-surface)" strokeWidth={2}>
            {chartData.map((entry, i) => (
              <Cell key={entry.name} fill={i < 3 ? SLOT_COLORS[i] : OTHER_COLOR} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value ?? 0);
              return [`€${v.toFixed(2)} (${((v / total) * 100).toFixed(0)}%)`, name];
            }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
