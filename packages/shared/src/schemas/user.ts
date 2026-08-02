import { z } from "zod";
import { RoleSchema } from "./enums.js";

const phoneField = z
  .string()
  .max(30)
  .regex(/^[0-9+()\-.\s]*$/, "Phone number contains invalid characters")
  .nullish();

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: RoleSchema,
  phone: phoneField,
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: RoleSchema,
  phone: phoneField,
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
