"use client";

import * as React from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { MenuItemFormDialog } from "@/components/menu/MenuItemFormDialog";
import { RecipeEditorDialog } from "@/components/menu/RecipeEditorDialog";
import { useDeleteMenuItem, useMenuItems, type MenuItem } from "@/hooks/useMenuItems";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";

export default function MenuPage() {
  const { data: menuItems, isLoading } = useMenuItems();
  const deleteMenuItem = useDeleteMenuItem();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MenuItem | null>(null);
  const [recipeOpen, setRecipeOpen] = React.useState(false);
  const [recipeTarget, setRecipeTarget] = React.useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MenuItem | null>(null);

  const filtered = (menuItems ?? []).filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()),
  );

  // Keep the recipe dialog's data in sync as mutations invalidate the menu-items query.
  const liveRecipeTarget = recipeTarget ? (menuItems ?? []).find((m) => m.id === recipeTarget.id) ?? recipeTarget : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Menu</h1>
          <p className="text-sm text-muted-foreground">Products, recipes, and per-item profit margins.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add menu item
          </Button>
        )}
      </div>

      <Input placeholder="Search menu…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <UtensilsCrossed className="h-8 w-8" />
          <p className="text-sm">No menu items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuItemCard
              key={item.id}
              menuItem={item}
              canManage={canManage}
              onEdit={() => {
                setEditing(item);
                setFormOpen(true);
              }}
              onEditRecipe={() => {
                setRecipeTarget(item);
                setRecipeOpen(true);
              }}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      <MenuItemFormDialog open={formOpen} onOpenChange={setFormOpen} menuItem={editing} />
      <RecipeEditorDialog open={recipeOpen} onOpenChange={setRecipeOpen} menuItem={liveRecipeTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This also removes its recipe links. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleteMenuItem.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMenuItem.mutateAsync(deleteTarget.id);
            toast.success("Menu item deleted");
            setDeleteTarget(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Something went wrong");
          }
        }}
      />
    </div>
  );
}
