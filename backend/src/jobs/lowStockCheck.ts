import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";

export interface LowStockAlert {
  restaurantId: string;
  restaurantName: string;
  ingredientId: string;
  ingredientName: string;
  stockQty: string;
  minThreshold: string;
}

export async function runLowStockCheck(): Promise<LowStockAlert[]> {
  const ingredients = await prisma.ingredient.findMany({
    include: { restaurant: true },
  });

  const alerts: LowStockAlert[] = ingredients
    .filter((i) => i.stockQty.lessThanOrEqualTo(i.minThreshold))
    .map((i) => ({
      restaurantId: i.restaurantId,
      restaurantName: i.restaurant.name,
      ingredientId: i.id,
      ingredientName: i.name,
      stockQty: i.stockQty.toFixed(3),
      minThreshold: i.minThreshold.toFixed(3),
    }));

  for (const alert of alerts) {
    console.log(
      `[low-stock] ${alert.restaurantName}: "${alert.ingredientName}" at ${alert.stockQty} (threshold ${alert.minThreshold})`,
    );
    if (env.EMAIL_ALERTS_ENABLED) {
      await sendLowStockEmail(alert);
    }
  }

  return alerts;
}

async function sendLowStockEmail(alert: LowStockAlert) {
  // Stubbed until SMTP/email provider credentials are configured.
  console.log(`[email-stub] would email low-stock alert for "${alert.ingredientName}"`);
}
