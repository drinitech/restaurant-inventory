"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIngredients } from "@/hooks/useIngredients";
import { useCreateRecipe, useDeleteRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { ApiError } from "@/lib/api-client";
import type { MenuItem } from "@/hooks/useMenuItems";

interface RecipeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
}

export function RecipeEditorDialog({ open, onOpenChange, menuItem }: RecipeEditorDialogProps) {
  const { data: ingredients } = useIngredients();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [newIngredientId, setNewIngredientId] = React.useState("");
  const [newQuantity, setNewQuantity] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNewIngredientId("");
      setNewQuantity("");
    }
  }, [open]);

  if (!menuItem) return null;

  const usedIds = new Set(menuItem.recipes.map((r) => r.ingredientId));
  const availableIngredients = (ingredients ?? []).filter((i) => !usedIds.has(i.id));

  async function handleAdd() {
    const qty = Number(newQuantity);
    if (!newIngredientId || !qty || qty <= 0) return;
    try {
      await createRecipe.mutateAsync({ menuItemId: menuItem!.id, ingredientId: newIngredientId, quantity: qty });
      setNewIngredientId("");
      setNewQuantity("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleQuantityChange(recipeId: string, value: string) {
    const qty = Number(value);
    if (!qty || qty <= 0) return;
    try {
      await updateRecipe.mutateAsync({ id: recipeId, quantity: qty });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleRemove(recipeId: string) {
    try {
      await deleteRecipe.mutateAsync(recipeId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recipe — {menuItem.name}</DialogTitle>
          <DialogDescription>Ingredients and quantities used to make one unit.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {menuItem.recipes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No ingredients linked yet.</p>
          )}
          {menuItem.recipes.map((recipe) => (
            <div key={recipe.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <span className="flex-1 truncate text-sm font-medium">{recipe.ingredient.name}</span>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={recipe.quantity}
                onBlur={(e) => handleQuantityChange(recipe.id, e.target.value)}
                className="w-24"
              />
              <span className="w-10 text-xs text-muted-foreground">{recipe.ingredient.unit.toLowerCase()}</span>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(recipe.id)} disabled={deleteRecipe.isPending}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {availableIngredients.length > 0 && (
          <div className="flex items-end gap-2 border-t border-border pt-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Ingredient</label>
              <Select
                value={newIngredientId}
                onValueChange={(v) => setNewIngredientId(v ?? "")}
                items={availableIngredients.map((i) => ({ value: i.id, label: i.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {availableIngredients.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <label className="text-xs text-muted-foreground">Qty</label>
              <Input type="number" step="0.001" min="0.001" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
            </div>
            <Button type="button" size="icon" onClick={handleAdd} disabled={!newIngredientId || !newQuantity || createRecipe.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
