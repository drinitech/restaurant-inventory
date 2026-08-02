"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export interface LowStockAlert {
  ingredientId: string;
  name: string;
  unit: string;
  stockQty: string;
  minThreshold: string;
  severity: "warning" | "serious" | "critical";
}

export interface ProfitabilityRow {
  menuItemId: string;
  name: string;
  category: string;
  price: string;
  totalCost: string;
  profit: string;
  marginPct: string;
}

export interface InventoryValue {
  totalValue: string;
  ingredientCount: number;
  breakdown: { ingredientId: string; name: string; value: string }[];
}

export interface TopItemRow {
  menuItemId: string;
  name: string;
  quantitySold?: number;
  revenue?: string;
  totalCost?: string;
  profit?: string;
  marginPct?: string;
  category?: string;
  price?: string;
}

export interface IngredientUsagePoint {
  date: string;
  quantity: string;
}

const canViewReports = () => {
  const role = useAuthStore.getState().user?.role;
  return role === "ADMIN" || role === "MANAGER";
};

export function useLowStock(options?: { pollMs?: number }) {
  return useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: () => api.get<LowStockAlert[]>("/reports/low-stock"),
    enabled: canViewReports(),
    refetchInterval: options?.pollMs ?? 60_000,
  });
}

export function useProfitability() {
  return useQuery({
    queryKey: ["reports", "profitability"],
    queryFn: () => api.get<ProfitabilityRow[]>("/reports/profitability"),
    enabled: canViewReports(),
  });
}

export function useInventoryValue() {
  return useQuery({
    queryKey: ["reports", "inventory-value"],
    queryFn: () => api.get<InventoryValue>("/reports/inventory-value"),
    enabled: canViewReports(),
  });
}

export function useTopItems(metric: "profit" | "sales", n = 5) {
  return useQuery({
    queryKey: ["reports", "top-items", metric, n],
    queryFn: () => api.get<TopItemRow[]>(`/reports/top-items?metric=${metric}&n=${n}`),
    enabled: canViewReports(),
  });
}

export interface SpendTrendPoint {
  date: string;
  spend: string;
}

export function useSpendTrend(days = 7) {
  return useQuery({
    queryKey: ["reports", "spend-trend", days],
    queryFn: () => api.get<SpendTrendPoint[]>(`/reports/spend-trend?days=${days}`),
    enabled: canViewReports(),
  });
}

export function useIngredientUsage(ingredientId: string | undefined) {
  return useQuery({
    queryKey: ["reports", "ingredient-usage", ingredientId],
    queryFn: () => api.get<IngredientUsagePoint[]>(`/reports/ingredient-usage/${ingredientId}`),
    enabled: canViewReports() && !!ingredientId,
  });
}
