import { z } from "zod";
import { MovementTypeSchema } from "./enums.js";

export const CreateStockMovementSchema = z.object({
  ingredientId: z.string().cuid(),
  type: MovementTypeSchema,
  quantity: z.coerce.number().positive(),
  purchasePrice: z.coerce.number().min(0).nullish(),
  notes: z.string().max(500).nullish(),
});
export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>;
