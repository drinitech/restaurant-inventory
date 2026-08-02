"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useCreateSale } from "@/hooks/useSales";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function SalesPage() {
  const { data: menuItems, isLoading } = useMenuItems();
  const createSale = useCreateSale();
  const [cart, setCart] = React.useState<Record<string, CartLine>>({});
  const [justCompleted, setJustCompleted] = React.useState(false);

  const activeItems = (menuItems ?? []).filter((m) => m.active);
  const lines = Object.values(cart);
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  function addToCart(menuItemId: string, name: string, price: number) {
    setCart((prev) => {
      const existing = prev[menuItemId];
      return { ...prev, [menuItemId]: { menuItemId, name, price, quantity: (existing?.quantity ?? 0) + 1 } };
    });
  }

  function changeQty(menuItemId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[menuItemId];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const { [menuItemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [menuItemId]: { ...existing, quantity: nextQty } };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function completeSale() {
    if (lines.length === 0) return;
    const results = await Promise.allSettled(
      lines.map((line) => createSale.mutateAsync({ menuItemId: line.menuItemId, quantity: line.quantity })),
    );

    const failures: { name: string; message: string }[] = [];
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        const err = result.reason;
        failures.push({ name: lines[i].name, message: err instanceof ApiError ? err.message : "Failed" });
      }
    });

    if (failures.length === 0) {
      setJustCompleted(true);
      toast.success(`Sale recorded — €${total.toFixed(2)}`);
      clearCart();
      setTimeout(() => setJustCompleted(false), 1400);
    } else {
      // Remove only the lines that succeeded; keep failed ones so staff can retry/adjust.
      const failedNames = new Set(failures.map((f) => f.name));
      setCart((prev) => {
        const next: Record<string, CartLine> = {};
        for (const [id, line] of Object.entries(prev)) {
          if (failedNames.has(line.name)) next[id] = line;
        }
        return next;
      });
      failures.forEach((f) => toast.error(`${f.name}: ${f.message}`));
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Record Sale</h1>
          <p className="text-sm text-muted-foreground">Tap an item to add it to the sale.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {activeItems.map((item) => {
              const inCart = cart[item.id]?.quantity ?? 0;
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item.id, item.name, Number(item.price))}
                  className={cn(
                    "relative flex h-28 flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-all active:scale-[0.97]",
                    inCart > 0 ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  {inCart > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow">
                      {inCart}
                    </span>
                  )}
                  <div>
                    <p className="font-medium leading-tight">{item.name}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold tabular-nums">€{Number(item.price).toFixed(2)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full shrink-0 lg:w-80">
        <div className="sticky top-6 flex flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-medium">Current sale</span>
            {itemCount > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-muted-foreground" onClick={clearCart}>
                Clear
              </Button>
            )}
          </div>

          <div className="max-h-[50vh] min-h-24 overflow-y-auto p-3">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No items yet.</p>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => (
                  <div key={line.menuItemId} className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">€{line.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(line.menuItemId, -1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(line.menuItemId, 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => changeQty(line.menuItemId, -line.quantity)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total ({itemCount} items)</span>
              <span className="text-lg font-semibold tabular-nums">€{total.toFixed(2)}</span>
            </div>
            <Button className="relative w-full overflow-hidden" size="lg" disabled={lines.length === 0 || createSale.isPending} onClick={completeSale}>
              <AnimatePresence mode="wait" initial={false}>
                {justCompleted ? (
                  <motion.span
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Recorded
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {createSale.isPending ? "Recording…" : "Complete sale"}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
