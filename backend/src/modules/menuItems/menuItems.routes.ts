import { Router } from "express";
import { CreateMenuItemSchema, UpdateMenuItemSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError } from "../../utils/AppError.js";
import { prisma } from "../../prisma/client.js";

export const menuItemsRouter = Router();
menuItemsRouter.use(requireAuth);

menuItemsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: req.user!.restaurantId },
      include: { recipes: { include: { ingredient: true } } },
      orderBy: { name: "asc" },
    });
    res.json(menuItems);
  }),
);

menuItemsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
      include: { recipes: { include: { ingredient: true } } },
    });
    if (!menuItem) throw new NotFoundError("MenuItem");
    res.json(menuItem);
  }),
);

menuItemsRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  validate(CreateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const menuItem = await prisma.menuItem.create({
      data: { ...req.body, restaurantId: req.user!.restaurantId },
    });
    res.status(201).json(menuItem);
  }),
);

menuItemsRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  validate(UpdateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    });
    if (!existing) throw new NotFoundError("MenuItem");
    const menuItem = await prisma.menuItem.update({ where: { id: existing.id }, data: req.body });
    res.json(menuItem);
  }),
);

menuItemsRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    });
    if (!existing) throw new NotFoundError("MenuItem");
    await prisma.menuItem.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);
