"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Package, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/DataTable";
import { StockProgressBar } from "@/components/shared/StockProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IngredientFormDialog } from "@/components/ingredients/IngredientFormDialog";
import { StockMovementDialog } from "@/components/ingredients/StockMovementDialog";
import { useDeleteIngredient, useIngredients, type Ingredient } from "@/hooks/useIngredients";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";

export default function IngredientsPage() {
  const { data: ingredients, isLoading } = useIngredients();
  const deleteIngredient = useDeleteIngredient();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Ingredient | null>(null);
  const [movementOpen, setMovementOpen] = React.useState(false);
  const [movementTarget, setMovementTarget] = React.useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Ingredient | null>(null);

  const columns = React.useMemo<ColumnDef<Ingredient, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.unit}</span>,
      },
      {
        id: "stock",
        header: "Stock level",
        cell: ({ row }) => {
          const stockQty = Number(row.original.stockQty);
          const minThreshold = Number(row.original.minThreshold);
          const ratio = minThreshold > 0 ? stockQty / minThreshold : stockQty > 0 ? Infinity : 0;
          const status = ratio <= 0 ? "critical" : ratio <= 1 ? "serious" : ratio <= 1.5 ? "warning" : "good";
          return (
            <div className="flex min-w-40 flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="tabular-nums font-medium">
                  {stockQty} {row.original.unit.toLowerCase()}
                </span>
                <span className="text-muted-foreground">min {minThreshold}</span>
              </div>
              <StockProgressBar stockQty={stockQty} minThreshold={minThreshold} />
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const stockQty = Number(row.original.stockQty);
          const minThreshold = Number(row.original.minThreshold);
          const ratio = minThreshold > 0 ? stockQty / minThreshold : stockQty > 0 ? Infinity : 0;
          if (ratio <= 0) return <StatusBadge status="critical">Out of stock</StatusBadge>;
          if (ratio <= 1) return <StatusBadge status="serious">Below threshold</StatusBadge>;
          if (ratio <= 1.5) return <StatusBadge status="warning">Running low</StatusBadge>;
          return <StatusBadge status="good">OK</StatusBadge>;
        },
      },
      {
        accessorKey: "costPerUnit",
        header: "Cost / unit",
        cell: ({ row }) => <span className="tabular-nums">€{Number(row.original.costPerUnit).toFixed(2)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setMovementTarget(row.original);
                    setMovementOpen(true);
                  }}
                >
                  <PackagePlus className="h-4 w-4" />
                  Record stock
                </DropdownMenuItem>
                {canManage && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(row.original);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canManage],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ingredients</h1>
          <p className="text-sm text-muted-foreground">Stock levels, costs, and reorder thresholds.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add ingredient
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={ingredients ?? []}
        loading={isLoading}
        searchPlaceholder="Search ingredients…"
        emptyMessage="No ingredients yet."
      />

      {(!ingredients || ingredients.length === 0) && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <Package className="h-8 w-8" />
          <p className="text-sm">Add your first ingredient to start tracking stock.</p>
        </div>
      )}

      <IngredientFormDialog open={formOpen} onOpenChange={setFormOpen} ingredient={editing} />
      <StockMovementDialog open={movementOpen} onOpenChange={setMovementOpen} ingredient={movementTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This cannot be undone. Ingredients used in a recipe cannot be deleted."
        confirmLabel="Delete"
        destructive
        loading={deleteIngredient.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteIngredient.mutateAsync(deleteTarget.id);
            toast.success("Ingredient deleted");
            setDeleteTarget(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Something went wrong");
          }
        }}
      />
    </div>
  );
}
