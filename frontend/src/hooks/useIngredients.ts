"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateIngredientInput, UpdateIngredientInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";

export interface Ingredient {
  id: string;
  name: string;
  unit: "KG" | "G" | "L" | "ML" | "PIECE";
  stockQty: string;
  costPerUnit: string;
  minThreshold: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.get<Ingredient[]>("/ingredients"),
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIngredientInput) => api.post<Ingredient>("/ingredients", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateIngredientInput & { id: string }) => api.put<Ingredient>(`/ingredients/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ingredients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}
