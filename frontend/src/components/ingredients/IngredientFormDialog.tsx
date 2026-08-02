"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CreateIngredientSchema } from "@restaurant-inventory/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateIngredient, useUpdateIngredient, type Ingredient } from "@/hooks/useIngredients";
import { ApiError } from "@/lib/api-client";

type FormInput = z.input<typeof CreateIngredientSchema>;
type FormOutput = z.output<typeof CreateIngredientSchema>;

const UNITS = ["KG", "G", "L", "ML", "PIECE"] as const;

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
}

export function IngredientFormDialog({ open, onOpenChange, ingredient }: IngredientFormDialogProps) {
  const isEdit = !!ingredient;
  const create = useCreateIngredient();
  const update = useUpdateIngredient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateIngredientSchema),
    defaultValues: { name: "", unit: "KG", stockQty: 0, costPerUnit: 0, minThreshold: 0 },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        ingredient
          ? {
              name: ingredient.name,
              unit: ingredient.unit,
              stockQty: Number(ingredient.stockQty),
              costPerUnit: Number(ingredient.costPerUnit),
              minThreshold: Number(ingredient.minThreshold),
            }
          : { name: "", unit: "KG", stockQty: 0, costPerUnit: 0, minThreshold: 0 },
      );
    }
  }, [open, ingredient, reset]);

  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: ingredient.id, ...values });
        toast.success("Ingredient updated");
      } else {
        await create.mutateAsync(values);
        toast.success("Ingredient added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit ingredient" : "Add ingredient"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ing-name">Name</Label>
            <Input id="ing-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ing-unit">Unit</Label>
              <Select
                value={watch("unit")}
                onValueChange={(v) => setValue("unit", v as FormInput["unit"])}
                items={UNITS.map((u) => ({ value: u, label: u }))}
              >
                <SelectTrigger id="ing-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ing-stock">Stock quantity</Label>
              <Input id="ing-stock" type="number" step="0.001" min="0" {...register("stockQty")} />
              {errors.stockQty && <p className="text-sm text-destructive">{errors.stockQty.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ing-cost">Cost per unit (€)</Label>
              <Input id="ing-cost" type="number" step="0.01" min="0" {...register("costPerUnit")} />
              {errors.costPerUnit && <p className="text-sm text-destructive">{errors.costPerUnit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ing-threshold">Min threshold</Label>
              <Input id="ing-threshold" type="number" step="0.001" min="0" {...register("minThreshold")} />
              {errors.minThreshold && <p className="text-sm text-destructive">{errors.minThreshold.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add ingredient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
