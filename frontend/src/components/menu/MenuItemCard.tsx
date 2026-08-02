"use client";

import Image from "next/image";
import { ChefHat, MoreHorizontal, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/hooks/useMenuItems";

interface MenuItemCardProps {
  menuItem: MenuItem;
  canManage: boolean;
  onEdit: () => void;
  onEditRecipe: () => void;
  onDelete: () => void;
}

export function MenuItemCard({ menuItem, canManage, onEdit, onEditRecipe, onDelete }: MenuItemCardProps) {
  const price = Number(menuItem.price);
  const totalCost = menuItem.recipes.reduce((sum, r) => sum + Number(r.quantity) * Number(r.ingredient.costPerUnit), 0);
  const profit = price - totalCost;
  const marginPct = price > 0 ? (profit / price) * 100 : 0;
  const marginClamped = Math.max(0, Math.min(100, marginPct));

  const marginColor = marginPct < 0 ? "bg-[var(--viz-critical)]" : marginPct < 20 ? "bg-[var(--viz-serious)]" : marginPct < 50 ? "bg-[var(--viz-warning)]" : "bg-[var(--viz-good)]";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {menuItem.imageUrl ? (
          <Image src={menuItem.imageUrl} alt={menuItem.name} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
        )}
        {!menuItem.active && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Inactive
          </Badge>
        )}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="absolute right-2 top-2 h-7 w-7 shadow" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditRecipe}>
                <ChefHat className="h-4 w-4" />
                Edit recipe
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{menuItem.name}</p>
            <p className="text-xs text-muted-foreground">{menuItem.category}</p>
          </div>
          <p className="shrink-0 font-semibold tabular-nums">€{price.toFixed(2)}</p>
        </div>
        {menuItem.recipes.length === 0 ? (
          <button onClick={canManage ? onEditRecipe : undefined} className="text-left text-xs text-muted-foreground hover:text-foreground">
            No recipe linked {canManage && "— click to add"}
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Margin</span>
              <span className={cn("font-medium tabular-nums", marginPct < 0 && "text-[var(--viz-critical)]")}>{marginPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-[width] duration-500", marginColor)} style={{ width: `${marginClamped}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
