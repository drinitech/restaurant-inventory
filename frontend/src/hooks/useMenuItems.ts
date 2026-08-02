"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateMenuItemInput, UpdateMenuItemInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";
import type { Ingredient } from "@/hooks/useIngredients";

export interface Recipe {
  id: string;
  menuItemId: string;
  ingredientId: string;
  quantity: string;
  ingredient: Ingredient;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: string;
  active: boolean;
  imageUrl: string | null;
  restaurantId: string;
  recipes: Recipe[];
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu-items"],
    queryFn: () => api.get<MenuItem[]>("/menu-items"),
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMenuItemInput) => api.post<MenuItem>("/menu-items", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMenuItemInput & { id: string }) => api.put<MenuItem>(`/menu-items/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}
