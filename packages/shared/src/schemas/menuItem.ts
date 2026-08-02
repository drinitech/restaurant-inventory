import { z } from "zod";

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  price: z.coerce.number().positive(),
  active: z.boolean().default(true),
  imageUrl: z.string().url().nullish(),
});
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
