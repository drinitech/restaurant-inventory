import { Prisma } from "@prisma/client";
import type { CreateStockMovementInput } from "@restaurant-inventory/shared";
import { prisma } from "../../prisma/client.js";
import { InsufficientStockError, NotFoundError } from "../../utils/AppError.js";

export async function recordStockMovement(input: CreateStockMovementInput & { userId: string; restaurantId: string }) {
  return prisma.$transaction(
    async (tx) => {
      const ingredient = await tx.ingredient.findFirst({
        where: { id: input.ingredientId, restaurantId: input.restaurantId },
      });
      if (!ingredient) throw new NotFoundError("Ingredient");

      const locked = await tx.$queryRaw<{ id: string; stockQty: Prisma.Decimal; name: string }[]>`
        SELECT id, "stockQty", name FROM "Ingredient" WHERE id = ${ingredient.id} FOR UPDATE
      `;
      const current = locked[0];

      const quantity = new Prisma.Decimal(input.quantity);
      const isOutflow = input.type === "OUT" || input.type === "LOSS";

      if (isOutflow && current.stockQty.lessThan(quantity)) {
        throw new InsufficientStockError(current.id, current.name, quantity.toString(), current.stockQty.toString());
      }

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: { stockQty: isOutflow ? { decrement: quantity } : { increment: quantity } },
      });

      return tx.stockMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: input.type,
          quantity,
          purchasePrice: input.type === "IN" ? input.purchasePrice ?? undefined : undefined,
          notes: input.notes ?? undefined,
          userId: input.userId,
        },
        include: { ingredient: true },
      });
    },
    { timeout: 10000, maxWait: 15000 },
  );
}
