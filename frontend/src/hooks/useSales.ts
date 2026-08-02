"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSaleInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => api.post("/sales", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
