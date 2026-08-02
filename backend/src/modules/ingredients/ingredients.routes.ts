import { Router } from "express";
import { CreateIngredientSchema, UpdateIngredientSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError } from "../../utils/AppError.js";
import { prisma } from "../../prisma/client.js";

export const ingredientsRouter = Router();
ingredientsRouter.use(requireAuth);

ingredientsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const ingredients = await prisma.ingredient.findMany({
      where: { restaurantId: req.user!.restaurantId },
      orderBy: { name: "asc" },
    });
    res.json(ingredients);
  }),
);

ingredientsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    });
    if (!ingredient) throw new NotFoundError("Ingredient");
    res.json(ingredient);
  }),
);

ingredientsRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  validate(CreateIngredientSchema),
  asyncHandler(async (req, res) => {
    const ingredient = await prisma.ingredient.create({
      data: { ...req.body, restaurantId: req.user!.restaurantId },
    });
    res.status(201).json(ingredient);
  }),
);

ingredientsRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  validate(UpdateIngredientSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    });
    if (!existing) throw new NotFoundError("Ingredient");
    const ingredient = await prisma.ingredient.update({ where: { id: existing.id }, data: req.body });
    res.json(ingredient);
  }),
);

ingredientsRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    });
    if (!existing) throw new NotFoundError("Ingredient");
    await prisma.ingredient.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);
