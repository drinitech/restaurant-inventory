"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLowStock } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  warning: "bg-[var(--viz-warning)]",
  serious: "bg-[var(--viz-serious)]",
  critical: "bg-[var(--viz-critical)]",
};

export function NotificationBell() {
  const { data: alerts } = useLowStock();
  const count = alerts?.length ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--viz-critical)] px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Low stock alerts</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!alerts || alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">All ingredients are above threshold.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.ingredientId} className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[alert.severity])} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{alert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.stockQty} {alert.unit.toLowerCase()} left · threshold {alert.minThreshold}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {alerts && alerts.length > 0 && (
          <div className="border-t border-border p-2">
            <Button render={<Link href="/ingredients" />} variant="ghost" size="sm" className="w-full">
              View ingredients
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
