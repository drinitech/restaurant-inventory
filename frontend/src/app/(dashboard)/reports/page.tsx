"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { WeeklySpendChart } from "@/components/charts/WeeklySpendChart";
import { TopItemsBarChart } from "@/components/charts/TopItemsBarChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { UsageTrendChart } from "@/components/charts/UsageTrendChart";
import { useIngredients } from "@/hooks/useIngredients";
import { useIngredientUsage, useProfitability, useSpendTrend, useTopItems, type ProfitabilityRow } from "@/hooks/useReports";
import { downloadExport } from "@/lib/api-client";
import type { ColumnDef } from "@tanstack/react-table";

const RANGE_DAYS: Record<string, number> = { week: 7, month: 30, year: 365 };

export default function ReportsPage() {
  const [range, setRange] = React.useState<"week" | "month" | "year">("week");
  const [ingredientId, setIngredientId] = React.useState<string>("");

  const { data: profitability, isLoading: loadingProfit } = useProfitability();
  const { data: topProfit, isLoading: loadingTopProfit } = useTopItems("profit", 5);
  const { data: topSales, isLoading: loadingTopSales } = useTopItems("sales", 5);
  const { data: spendTrend, isLoading: loadingTrend } = useSpendTrend(RANGE_DAYS[range]);
  const { data: ingredients } = useIngredients();
  const { data: usage, isLoading: loadingUsage } = useIngredientUsage(ingredientId || undefined);

  const selectedIngredient = ingredients?.find((i) => i.id === ingredientId);

  const categoryData = React.useMemo(() => {
    if (!profitability) return [];
    const totals = new Map<string, number>();
    for (const row of profitability) {
      totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.totalCost));
    }
    return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
  }, [profitability]);

  const columns = React.useMemo<ColumnDef<ProfitabilityRow, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Item" },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "price", header: "Price", cell: ({ row }) => `€${row.original.price}` },
      { accessorKey: "totalCost", header: "Cost", cell: ({ row }) => `€${row.original.totalCost}` },
      {
        accessorKey: "profit",
        header: "Profit",
        cell: ({ row }) => (
          <span className={Number(row.original.profit) < 0 ? "text-[var(--viz-critical)]" : ""}>€{row.original.profit}</span>
        ),
      },
      { accessorKey: "marginPct", header: "Margin", cell: ({ row }) => `${row.original.marginPct}%` },
    ],
    [],
  );

  async function handleExport(format: "csv" | "pdf") {
    try {
      await downloadExport(`/reports/profitability?format=${format}`, `profitability.${format}`);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Profitability, spend, and usage trends.</p>
        </div>
        <Select value={range} onValueChange={(v) => v && setRange(v as typeof range)} items={[{ value: "week", label: "Last 7 days" }, { value: "month", label: "Last 30 days" }, { value: "year", label: "Last 365 days" }]}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 365 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 font-medium">Most profitable items</p>
          <TopItemsBarChart data={topProfit?.map((t) => ({ name: t.name, value: Number(t.profit ?? 0) }))} loading={loadingTopProfit} valuePrefix="€" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 font-medium">Best sellers (by quantity)</p>
          <TopItemsBarChart data={topSales?.map((t) => ({ name: t.name, value: Number(t.quantitySold ?? 0) }))} loading={loadingTopSales} valueSuffix=" sold" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
          <p className="mb-3 font-medium">Spend trend</p>
          <WeeklySpendChart data={spendTrend} loading={loadingTrend} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 font-medium">Cost by category</p>
          <CategoryDonutChart data={categoryData} loading={loadingProfit} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">Ingredient usage trend</p>
          <Select
            value={ingredientId}
            onValueChange={(v) => setIngredientId(v ?? "")}
            items={(ingredients ?? []).map((i) => ({ value: i.id, label: i.name }))}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Choose ingredient" />
            </SelectTrigger>
            <SelectContent>
              {(ingredients ?? []).map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {ingredientId ? (
          <UsageTrendChart data={usage} loading={loadingUsage} unit={selectedIngredient?.unit.toLowerCase() ?? ""} />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Choose an ingredient to see its usage trend.</div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">Profitability by menu item</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>
        <DataTable columns={columns} data={profitability ?? []} loading={loadingProfit} searchPlaceholder="Search menu items…" />
      </div>
    </div>
  );
}
