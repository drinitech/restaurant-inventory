import { prisma } from "../prisma/client.js";

const prefixes = ["Smoke Test", "Concurrency", "Debug"];

async function main() {
  for (const prefix of prefixes) {
    await prisma.sale.deleteMany({ where: { menuItem: { name: { startsWith: prefix } } } });
    await prisma.recipe.deleteMany({
      where: { OR: [{ menuItem: { name: { startsWith: prefix } } }, { ingredient: { name: { startsWith: prefix } } }] },
    });
    await prisma.stockMovement.deleteMany({ where: { ingredient: { name: { startsWith: prefix } } } });
    await prisma.menuItem.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.ingredient.deleteMany({ where: { name: { startsWith: prefix } } });
  }
  console.log("cleanup done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
