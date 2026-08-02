import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "seed-restaurant" },
    update: {},
    create: { id: "seed-restaurant", name: "Kafiteria Lulishte", address: "Rr. Deshmoret e Kombit, Tirane" },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin, manager, staff] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@lulishte.test" },
      update: {},
      create: { name: "Admin User", email: "admin@lulishte.test", passwordHash, role: "ADMIN", restaurantId: restaurant.id },
    }),
    prisma.user.upsert({
      where: { email: "manager@lulishte.test" },
      update: {},
      create: { name: "Manager User", email: "manager@lulishte.test", passwordHash, role: "MANAGER", restaurantId: restaurant.id },
    }),
    prisma.user.upsert({
      where: { email: "staff@lulishte.test" },
      update: {},
      create: { name: "Staff User", email: "staff@lulishte.test", passwordHash, role: "STAFF", restaurantId: restaurant.id },
    }),
  ]);

  const ingredientDefs = [
    { name: "Kafe (kokrra)", unit: "KG", stockQty: 8, costPerUnit: 12, minThreshold: 2 },
    { name: "Qumesht", unit: "L", stockQty: 15, costPerUnit: 1.2, minThreshold: 5 },
    { name: "Sheqer", unit: "KG", stockQty: 10, costPerUnit: 1.5, minThreshold: 2 },
    { name: "Miell", unit: "KG", stockQty: 20, costPerUnit: 0.9, minThreshold: 5 },
    { name: "Ve", unit: "PIECE", stockQty: 60, costPerUnit: 0.25, minThreshold: 12 },
    { name: "Cokolate", unit: "KG", stockQty: 4, costPerUnit: 9, minThreshold: 1.5 },
    { name: "Uje mineral (shishe)", unit: "PIECE", stockQty: 3, costPerUnit: 0.4, minThreshold: 10 },
    { name: "Limon", unit: "PIECE", stockQty: 25, costPerUnit: 0.3, minThreshold: 8 },
  ] as const;

  const ingredients: Record<string, { id: string }> = {};
  for (const def of ingredientDefs) {
    const ing = await prisma.ingredient.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: def.name } },
      update: {},
      create: { ...def, restaurantId: restaurant.id },
    });
    ingredients[def.name] = ing;
  }

  const menuItemDefs = [
    { name: "Espresso", category: "Kafe", price: 1.5 },
    { name: "Kapuçino", category: "Kafe", price: 1.8 },
    { name: "Cokollate e Nxehte", category: "Kafe", price: 2.2 },
    { name: "Limonade", category: "Pije Freskuese", price: 2.0 },
    { name: "Uje Mineral", category: "Pije Freskuese", price: 1.0 },
    { name: "Krep me Cokolate", category: "Embelsira", price: 3.5 },
  ] as const;

  const menuItems: Record<string, { id: string }> = {};
  for (const def of menuItemDefs) {
    const mi = await prisma.menuItem.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: def.name } },
      update: {},
      create: { ...def, active: true, restaurantId: restaurant.id },
    });
    menuItems[def.name] = mi;
  }

  const recipeDefs: Array<{ menuItem: string; ingredient: string; quantity: number }> = [
    { menuItem: "Espresso", ingredient: "Kafe (kokrra)", quantity: 0.018 },
    { menuItem: "Kapuçino", ingredient: "Kafe (kokrra)", quantity: 0.018 },
    { menuItem: "Kapuçino", ingredient: "Qumesht", quantity: 0.15 },
    { menuItem: "Cokollate e Nxehte", ingredient: "Qumesht", quantity: 0.2 },
    { menuItem: "Cokollate e Nxehte", ingredient: "Cokolate", quantity: 0.03 },
    { menuItem: "Limonade", ingredient: "Limon", quantity: 1 },
    { menuItem: "Limonade", ingredient: "Sheqer", quantity: 0.02 },
    { menuItem: "Uje Mineral", ingredient: "Uje mineral (shishe)", quantity: 1 },
    { menuItem: "Krep me Cokolate", ingredient: "Miell", quantity: 0.06 },
    { menuItem: "Krep me Cokolate", ingredient: "Ve", quantity: 1 },
    { menuItem: "Krep me Cokolate", ingredient: "Qumesht", quantity: 0.1 },
    { menuItem: "Krep me Cokolate", ingredient: "Cokolate", quantity: 0.04 },
  ];

  for (const def of recipeDefs) {
    await prisma.recipe.upsert({
      where: {
        menuItemId_ingredientId: {
          menuItemId: menuItems[def.menuItem].id,
          ingredientId: ingredients[def.ingredient].id,
        },
      },
      update: { quantity: def.quantity },
      create: {
        menuItemId: menuItems[def.menuItem].id,
        ingredientId: ingredients[def.ingredient].id,
        quantity: def.quantity,
      },
    });
  }

  console.log("Seed complete:", { restaurant: restaurant.name, admin: admin.email, manager: manager.email, staff: staff.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
