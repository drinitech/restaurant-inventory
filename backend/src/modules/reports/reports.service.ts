import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

export async function getProfitability(restaurantId: string) {
  const menuItems = await prisma.menuItem.findMany({
    where: { restaurantId },
    include: { recipes: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });

  return menuItems.map((item) => {
    const totalCost = item.recipes.reduce(
      (sum, r) => sum.add(r.quantity.mul(r.ingredient.costPerUnit)),
      new Prisma.Decimal(0),
    );
    const profit = item.price.sub(totalCost);
    const marginPct = item.price.isZero() ? new Prisma.Decimal(0) : profit.div(item.price).mul(100);
    return {
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      price: item.price.toFixed(2),
      totalCost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      marginPct: marginPct.toFixed(1),
    };
  });
}

export async function getLowStock(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId },
    orderBy: { name: "asc" },
  });
  return ingredients
    .filter((i) => i.stockQty.lessThanOrEqualTo(i.minThreshold))
    .map((i) => ({
      ingredientId: i.id,
      name: i.name,
      unit: i.unit,
      stockQty: i.stockQty.toFixed(3),
      minThreshold: i.minThreshold.toFixed(3),
      severity: i.stockQty.isZero() ? "critical" : i.stockQty.lessThan(i.minThreshold.div(2)) ? "serious" : "warning",
    }));
}

export async function getIngredientUsage(restaurantId: string, ingredientId: string, from?: Date, to?: Date) {
  const rows = await prisma.$queryRaw<{ day: Date; total: Prisma.Decimal }[]>`
    SELECT date_trunc('day', "date") AS day, SUM("quantity") AS total
    FROM "StockMovement"
    WHERE "ingredientId" = ${ingredientId}
      AND "type" = 'OUT'
      AND "ingredientId" IN (SELECT id FROM "Ingredient" WHERE "restaurantId" = ${restaurantId})
      ${from ? Prisma.sql`AND "date" >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND "date" <= ${to}` : Prisma.empty}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), quantity: r.total.toString() }));
}

export async function getInventoryValue(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({ where: { restaurantId } });
  const total = ingredients.reduce((sum, i) => sum.add(i.stockQty.mul(i.costPerUnit)), new Prisma.Decimal(0));
  return {
    totalValue: total.toFixed(2),
    ingredientCount: ingredients.length,
    breakdown: ingredients.map((i) => ({
      ingredientId: i.id,
      name: i.name,
      value: i.stockQty.mul(i.costPerUnit).toFixed(2),
    })),
  };
}

export async function getSpendTrend(restaurantId: string, days: number) {
  const rows = await prisma.$queryRaw<{ day: Date; total: Prisma.Decimal }[]>`
    SELECT date_trunc('day', "date") AS day, SUM("quantity" * COALESCE("purchasePrice", 0)) AS total
    FROM "StockMovement"
    WHERE "type" = 'IN'
      AND "date" >= NOW() - (${days}::text || ' days')::interval
      AND "ingredientId" IN (SELECT id FROM "Ingredient" WHERE "restaurantId" = ${restaurantId})
    GROUP BY day
    ORDER BY day ASC
  `;
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r.total.toFixed(2)]));

  const result: { date: string; spend: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, spend: byDay.get(key) ?? "0.00" });
  }
  return result;
}

export async function getTopItems(restaurantId: string, metric: "profit" | "sales", n: number) {
  if (metric === "sales") {
    const grouped = await prisma.sale.groupBy({
      by: ["menuItemId"],
      where: { menuItem: { restaurantId } },
      _sum: { quantity: true, totalRevenue: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: n,
    });
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: grouped.map((g) => g.menuItemId) } } });
    return grouped.map((g) => {
      const item = menuItems.find((m) => m.id === g.menuItemId);
      return {
        menuItemId: g.menuItemId,
        name: item?.name ?? "Unknown",
        quantitySold: g._sum.quantity ?? 0,
        revenue: g._sum.totalRevenue?.toFixed(2) ?? "0.00",
      };
    });
  }

  const profitability = await getProfitability(restaurantId);
  return profitability
    .slice()
    .sort((a, b) => Number(b.profit) - Number(a.profit))
    .slice(0, n);
}
