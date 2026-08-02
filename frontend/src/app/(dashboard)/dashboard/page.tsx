"use client";

import Link from "next/link";
import { AlertTriangle, PackageCheck, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WeeklySpendChart } from "@/components/charts/WeeklySpendChart";
import { useInventoryValue, useLowStock, useSpendTrend, useTopItems } from "@/hooks/useReports";
import { useAuthStore } from "@/lib/auth-store";

const SEVERITY_LABEL: Record<string, "warning" | "serious" | "critical"> = {
  warning: "warning",
  serious: "serious",
  critical: "critical",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: inventoryValue, isLoading: loadingValue } = useInventoryValue();
  const { data: alerts, isLoading: loadingAlerts } = useLowStock();
  const { data: topProfit, isLoading: loadingTop } = useTopItems("profit", 1);
  const { data: topSales, isLoading: loadingTopSales } = useTopItems("sales", 1);
  const { data: spendTrend, isLoading: loadingTrend } = useSpendTrend(7);

  const alertCount = alerts?.length ?? 0;
  const topItem = topProfit?.[0];
  const bestSeller = topSales?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(" ")[0]}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Inventory value"
          value={inventoryValue ? `€${Number(inventoryValue.totalValue).toFixed(2)}` : "—"}
          hint={inventoryValue ? `${inventoryValue.ingredientCount} ingredients` : undefined}
          icon={Wallet}
          loading={loadingValue}
        />
        <StatCard
          label="Active alerts"
          value={String(alertCount)}
          hint={alertCount > 0 ? "Ingredients below threshold" : "All stocked"}
          icon={AlertTriangle}
          loading={loadingAlerts}
          tone={alertCount > 0 ? "critical" : "default"}
        />
        <StatCard
          label="Most profitable item"
          value={topItem?.name ?? "—"}
          hint={topItem ? `€${topItem.profit} profit · ${topItem.marginPct}% margin` : undefined}
          icon={TrendingUp}
          loading={loadingTop}
        />
        <StatCard
          label="Best seller"
          value={bestSeller?.name ?? "—"}
          hint={bestSeller ? `${bestSeller.quantitySold} sold · €${bestSeller.revenue} revenue` : "No sales yet"}
          icon={PackageCheck}
          loading={loadingTopSales}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly spend</p>
              <p className="text-xs text-muted-foreground">Incoming-stock purchases, last 7 days</p>
            </div>
          </div>
          <WeeklySpendChart data={spendTrend} loading={loadingTrend} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">Low stock alerts</p>
            <Link href="/ingredients" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {loadingAlerts ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !alerts || alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">All ingredients are above threshold.</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 6).map((alert) => (
                <div key={alert.ingredientId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{alert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.stockQty} / min {alert.minThreshold} {alert.unit.toLowerCase()}
                    </p>
                  </div>
                  <StatusBadge status={SEVERITY_LABEL[alert.severity]}>{alert.severity}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
