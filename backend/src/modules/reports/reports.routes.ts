import { Router } from "express";
import { DateRangeQuerySchema, ExportFormatQuerySchema, TopItemsQuerySchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCsv } from "../../utils/csv.js";
import { sendPdfTable } from "../../utils/pdf.js";
import * as reportsService from "./reports.service.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole("ADMIN", "MANAGER"));

function respond(
  req: import("express").Request,
  res: import("express").Response,
  filenameBase: string,
  title: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  const format = (req.query.format as string) ?? "json";
  if (format === "csv") return sendCsv(res, `${filenameBase}.csv`, columns, rows);
  if (format === "pdf") return sendPdfTable(res, `${filenameBase}.pdf`, title, columns, rows);
  return res.json(rows);
}

reportsRouter.get(
  "/profitability",
  validate(ExportFormatQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const rows = await reportsService.getProfitability(req.user!.restaurantId);
    respond(req, res, "profitability", "Menu Item Profitability", ["name", "category", "price", "totalCost", "profit", "marginPct"], rows);
  }),
);

reportsRouter.get(
  "/low-stock",
  validate(ExportFormatQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const rows = await reportsService.getLowStock(req.user!.restaurantId);
    respond(req, res, "low-stock", "Low Stock Alerts", ["name", "unit", "stockQty", "minThreshold", "severity"], rows);
  }),
);

reportsRouter.get(
  "/ingredient-usage/:id",
  validate(DateRangeQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as { from?: Date; to?: Date };
    const rows = await reportsService.getIngredientUsage(req.user!.restaurantId, req.params.id, from, to);
    res.json(rows);
  }),
);

reportsRouter.get(
  "/inventory-value",
  asyncHandler(async (req, res) => {
    const result = await reportsService.getInventoryValue(req.user!.restaurantId);
    res.json(result);
  }),
);

reportsRouter.get(
  "/spend-trend",
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const rows = await reportsService.getSpendTrend(req.user!.restaurantId, days);
    res.json(rows);
  }),
);

reportsRouter.get(
  "/top-items",
  validate(TopItemsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { metric, n } = req.query as unknown as { metric: "profit" | "sales"; n: number };
    const rows = await reportsService.getTopItems(req.user!.restaurantId, metric, n);
    res.json(rows);
  }),
);
