import { z } from "zod";

export const DateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;

export const TopItemsQuerySchema = z.object({
  metric: z.enum(["profit", "sales"]).default("profit"),
  n: z.coerce.number().int().positive().max(50).default(5),
});
export type TopItemsQuery = z.infer<typeof TopItemsQuerySchema>;

export const ExportFormatQuerySchema = z.object({
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});
export type ExportFormatQuery = z.infer<typeof ExportFormatQuerySchema>;
