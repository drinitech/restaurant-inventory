import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { InsufficientStockError, NotFoundError } from "../../utils/AppError.js";

interface RecordSaleInput {
  menuItemId: string;
  quantity: number;
  userId: string;
  restaurantId: string;
}

export async function recordSale(input: RecordSaleInput) {
  return prisma.$transaction(
    async (tx) => {
      const menuItem = await tx.menuItem.findFirst({
        where: { id: input.menuItemId, restaurantId: input.restaurantId },
        include: { recipes: true },
      });
      if (!menuItem) throw new NotFoundError("MenuItem");

      const ingredientIds = [...new Set(menuItem.recipes.map((r) => r.ingredientId))].sort();

      // Lock affected ingredient rows in a deterministic order so two concurrent
      // sales with overlapping ingredients can never deadlock each other, and
      // neither can read a stale stockQty while the other is mid-update.
      const locked = ingredientIds.length
        ? await tx.$queryRaw<{ id: string; stockQty: Prisma.Decimal; name: string }[]>`
            SELECT id, "stockQty", name FROM "Ingredient"
            WHERE id = ANY(${ingredientIds}::text[])
            ORDER BY id
            FOR UPDATE
          `
        : [];
      const stockById = new Map(locked.map((r) => [r.id, r]));

      const saleQty = new Prisma.Decimal(input.quantity);

      for (const recipe of menuItem.recipes) {
        const needed = recipe.quantity.mul(saleQty);
        const row = stockById.get(recipe.ingredientId)!;
        if (row.stockQty.lessThan(needed)) {
          throw new InsufficientStockError(row.id, row.name, needed.toString(), row.stockQty.toString());
        }
      }

      for (const recipe of menuItem.recipes) {
        const needed = recipe.quantity.mul(saleQty);
        await tx.ingredient.update({
          where: { id: recipe.ingredientId },
          data: { stockQty: { decrement: needed } },
        });
        await tx.stockMovement.create({
          data: {
            ingredientId: recipe.ingredientId,
            type: "OUT",
            quantity: needed,
            userId: input.userId,
            notes: `Auto-deducted: ${input.quantity}x ${menuItem.name}`,
          },
        });
      }

      return tx.sale.create({
        data: {
          menuItemId: menuItem.id,
          quantity: input.quantity,
          totalRevenue: menuItem.price.mul(input.quantity),
          userId: input.userId,
        },
        include: { menuItem: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10000, maxWait: 15000 },
  );
}
