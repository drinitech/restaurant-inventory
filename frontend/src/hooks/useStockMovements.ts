"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateStockMovementInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";

export function useRecordStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStockMovementInput) => api.post("/stock-movements", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
