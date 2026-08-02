import { Router } from "express";
import { CreateStockMovementSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError } from "../../utils/AppError.js";
import { prisma } from "../../prisma/client.js";
import * as stockMovementsService from "./stockMovements.service.js";

export const stockMovementsRouter = Router();
stockMovementsRouter.use(requireAuth);

stockMovementsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const ingredientId = typeof req.query.ingredientId === "string" ? req.query.ingredientId : undefined;
    const movements = await prisma.stockMovement.findMany({
      where: {
        ingredient: { restaurantId: req.user!.restaurantId },
        ...(ingredientId ? { ingredientId } : {}),
      },
      include: { ingredient: true, user: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    });
    res.json(movements);
  }),
);

stockMovementsRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  validate(CreateStockMovementSchema),
  asyncHandler(async (req, res) => {
    // STAFF may only record incoming stock; LOSS/manual adjustments require MANAGER/ADMIN.
    if (req.user!.role === "STAFF" && req.body.type !== "IN") {
      throw new ForbiddenError("Staff can only record incoming stock (type IN)");
    }
    const movement = await stockMovementsService.recordStockMovement({
      ...req.body,
      userId: req.user!.sub,
      restaurantId: req.user!.restaurantId,
    });
    res.status(201).json(movement);
  }),
);
