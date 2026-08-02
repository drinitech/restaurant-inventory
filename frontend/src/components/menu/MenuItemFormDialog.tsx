"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CreateMenuItemSchema } from "@restaurant-inventory/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useCreateMenuItem, useUpdateMenuItem, type MenuItem } from "@/hooks/useMenuItems";
import { ApiError } from "@/lib/api-client";

type FormInput = z.input<typeof CreateMenuItemSchema>;
type FormOutput = z.output<typeof CreateMenuItemSchema>;

interface MenuItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem | null;
}

export function MenuItemFormDialog({ open, onOpenChange, menuItem }: MenuItemFormDialogProps) {
  const isEdit = !!menuItem;
  const create = useCreateMenuItem();
  const update = useUpdateMenuItem();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateMenuItemSchema),
    defaultValues: { name: "", category: "", price: 0, active: true, imageUrl: null },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        menuItem
          ? { name: menuItem.name, category: menuItem.category, price: Number(menuItem.price), active: menuItem.active, imageUrl: menuItem.imageUrl }
          : { name: "", category: "", price: 0, active: true, imageUrl: null },
      );
    }
  }, [open, menuItem, reset]);

  const pending = create.isPending || update.isPending;
  const imageUrl = watch("imageUrl");
  const active = watch("active");

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: menuItem.id, ...values });
        toast.success("Menu item updated");
      } else {
        await create.mutateAsync(values);
        toast.success("Menu item added");
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
          <DialogTitle>{isEdit ? "Edit menu item" : "Add menu item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-4">
            <ImageUploader value={imageUrl} onChange={(url) => setValue("imageUrl", url)} />
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mi-name">Name</Label>
                <Input id="mi-name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mi-category">Category</Label>
                <Input id="mi-category" placeholder="Kafe, Embelsira…" {...register("category")} />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mi-price">Price (€)</Label>
              <Input id="mi-price" type="number" step="0.01" min="0.01" {...register("price")} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="flex items-end justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="mi-active" className="cursor-pointer">
                Active
              </Label>
              <Switch id="mi-active" checked={active} onCheckedChange={(v) => setValue("active", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add menu item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
