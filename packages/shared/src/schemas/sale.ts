import { z } from "zod";

export const CreateSaleSchema = z.object({
  menuItemId: z.string().cuid(),
  quantity: z.coerce.number().int().positive(),
});
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
