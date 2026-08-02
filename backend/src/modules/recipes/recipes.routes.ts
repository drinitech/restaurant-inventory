import { Router } from "express";
import { CreateRecipeSchema, UpdateRecipeSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ConflictError, NotFoundError } from "../../utils/AppError.js";
import { prisma } from "../../prisma/client.js";

export const recipesRouter = Router();
recipesRouter.use(requireAuth);

async function assertOwnership(restaurantId: string, menuItemId: string, ingredientId: string) {
  const [menuItem, ingredient] = await Promise.all([
    prisma.menuItem.findFirst({ where: { id: menuItemId, restaurantId } }),
    prisma.ingredient.findFirst({ where: { id: ingredientId, restaurantId } }),
  ]);
  if (!menuItem) throw new NotFoundError("MenuItem");
  if (!ingredient) throw new NotFoundError("Ingredient");
}

recipesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const menuItemId = typeof req.query.menuItemId === "string" ? req.query.menuItemId : undefined;
    const recipes = await prisma.recipe.findMany({
      where: {
        menuItem: { restaurantId: req.user!.restaurantId },
        ...(menuItemId ? { menuItemId } : {}),
      },
      include: { ingredient: true },
    });
    res.json(recipes);
  }),
);

recipesRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  validate(CreateRecipeSchema),
  asyncHandler(async (req, res) => {
    const { menuItemId, ingredientId, quantity } = req.body;
    await assertOwnership(req.user!.restaurantId, menuItemId, ingredientId);
    const existing = await prisma.recipe.findUnique({
      where: { menuItemId_ingredientId: { menuItemId, ingredientId } },
    });
    if (existing) throw new ConflictError("This ingredient is already in the recipe for this menu item");
    const recipe = await prisma.recipe.create({ data: { menuItemId, ingredientId, quantity }, include: { ingredient: true } });
    res.status(201).json(recipe);
  }),
);

recipesRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  validate(UpdateRecipeSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, menuItem: { restaurantId: req.user!.restaurantId } },
    });
    if (!existing) throw new NotFoundError("Recipe");
    const recipe = await prisma.recipe.update({ where: { id: existing.id }, data: { quantity: req.body.quantity } });
    res.json(recipe);
  }),
);

recipesRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, menuItem: { restaurantId: req.user!.restaurantId } },
    });
    if (!existing) throw new NotFoundError("Recipe");
    await prisma.recipe.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);
