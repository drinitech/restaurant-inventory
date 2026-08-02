import { z } from "zod";
import { UnitSchema } from "./enums.js";

export const CreateIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  unit: UnitSchema,
  stockQty: z.coerce.number().min(0).default(0),
  costPerUnit: z.coerce.number().min(0).default(0),
  minThreshold: z.coerce.number().min(0).default(0),
});
export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>;

export const UpdateIngredientSchema = CreateIngredientSchema.partial();
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;
