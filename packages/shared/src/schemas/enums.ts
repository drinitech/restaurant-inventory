import { z } from "zod";

export const RoleSchema = z.enum(["ADMIN", "MANAGER", "STAFF"]);
export type Role = z.infer<typeof RoleSchema>;

export const UnitSchema = z.enum(["KG", "G", "L", "ML", "PIECE"]);
export type Unit = z.infer<typeof UnitSchema>;

export const MovementTypeSchema = z.enum(["IN", "OUT", "LOSS"]);
export type MovementType = z.infer<typeof MovementTypeSchema>;
