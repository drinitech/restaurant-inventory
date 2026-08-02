"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateStockMovementSchema, type CreateStockMovementInput } from "@restaurant-inventory/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRecordStockMovement } from "@/hooks/useStockMovements";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import type { Ingredient } from "@/hooks/useIngredients";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
}

export function StockMovementDialog({ open, onOpenChange, ingredient }: StockMovementDialogProps) {
  const role = useAuthStore((s) => s.user?.role);
  const canRecordLoss = role === "ADMIN" || role === "MANAGER";
  const record = useRecordStockMovement();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateStockMovementInput>({
    resolver: zodResolver(CreateStockMovementSchema),
    defaultValues: { ingredientId: "", type: "IN", quantity: 0 },
  });

  React.useEffect(() => {
    if (open && ingredient) {
      reset({ ingredientId: ingredient.id, type: "IN", quantity: 0, purchasePrice: undefined, notes: "" });
    }
  }, [open, ingredient, reset]);

  const type = watch("type");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await record.mutateAsync(values);
      toast.success(type === "IN" ? "Stock received" : "Loss recorded");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record stock movement</DialogTitle>
          <DialogDescription>{ingredient?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mv-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setValue("type", v as CreateStockMovementInput["type"])}
              items={[{ value: "IN", label: "Incoming (purchase)" }, ...(canRecordLoss ? [{ value: "LOSS", label: "Loss / waste" }] : [])]}
            >
              <SelectTrigger id="mv-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Incoming (purchase)</SelectItem>
                {canRecordLoss && <SelectItem value="LOSS">Loss / waste</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mv-qty">Quantity ({ingredient?.unit.toLowerCase()})</Label>
            <Input id="mv-qty" type="number" step="0.001" min="0.001" {...register("quantity")} />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
          </div>
          {type === "IN" && (
            <div className="space-y-2">
              <Label htmlFor="mv-price">Purchase price (€, optional)</Label>
              <Input id="mv-price" type="number" step="0.01" min="0" {...register("purchasePrice")} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="mv-notes">Notes (optional)</Label>
            <Textarea id="mv-notes" rows={2} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={record.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending ? "Saving…" : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
