import { Router } from "express";
import { CreateSaleSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../prisma/client.js";
import * as salesService from "./sales.service.js";

export const salesRouter = Router();
salesRouter.use(requireAuth);

salesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const sales = await prisma.sale.findMany({
      where: { menuItem: { restaurantId: req.user!.restaurantId } },
      include: { menuItem: true, user: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    });
    res.json(sales);
  }),
);

salesRouter.post(
  "/",
  validate(CreateSaleSchema),
  asyncHandler(async (req, res) => {
    const sale = await salesService.recordSale({
      menuItemId: req.body.menuItemId,
      quantity: req.body.quantity,
      userId: req.user!.sub,
      restaurantId: req.user!.restaurantId,
    });
    res.status(201).json(sale);
  }),
);
