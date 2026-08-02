import { z } from "zod";

export const CreateRecipeSchema = z.object({
  menuItemId: z.string().cuid(),
  ingredientId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
});
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

export const UpdateRecipeSchema = z.object({
  quantity: z.coerce.number().positive(),
});
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
