import "dotenv/config";
import { prisma } from "../prisma/client.js";
import { runLowStockCheck } from "../jobs/lowStockCheck.js";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:4000";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    passed++;
    console.log(`  OK  ${message}`);
  } else {
    failed++;
    console.error(`FAIL  ${message}`);
  }
}

async function api(path: string, options: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(rest.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await res.json().catch(() => undefined) : undefined;
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  console.log(`Smoke test against ${BASE_URL}\n`);

  console.log("Auth + RBAC");
  const adminLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@lulishte.test", password: "password123" }) });
  assert(adminLogin.status === 200 && adminLogin.body?.token, "admin login succeeds");
  const adminToken = adminLogin.body.token as string;

  const managerLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "manager@lulishte.test", password: "password123" }) });
  assert(managerLogin.status === 200 && managerLogin.body?.token, "manager login succeeds");
  const managerToken = managerLogin.body.token as string;

  const staffLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "staff@lulishte.test", password: "password123" }) });
  assert(staffLogin.status === 200 && staffLogin.body?.token, "staff login succeeds");
  const staffToken = staffLogin.body.token as string;

  const badLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@lulishte.test", password: "wrong" }) });
  assert(badLogin.status === 401, "wrong password rejected with 401");

  const staffTriesReports = await api("/reports/low-stock", { token: staffToken });
  assert(staffTriesReports.status === 403, "STAFF forbidden from /reports/*");

  const managerReports = await api("/reports/low-stock", { token: managerToken });
  assert(managerReports.status === 200, "MANAGER allowed on /reports/*");

  console.log("\nIngredient -> MenuItem -> Recipe -> Sale round trip");
  const restaurant = await prisma.restaurant.findFirstOrThrow({ where: { name: "Kafiteria Lulishte" } });

  const createIngredient = await api("/ingredients", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ name: `Smoke Test Syrup ${Date.now()}`, unit: "L", stockQty: 5, costPerUnit: 3, minThreshold: 1 }),
  });
  assert(createIngredient.status === 201, "create ingredient");
  const ingredientId = createIngredient.body.id as string;

  const createMenuItem = await api("/menu-items", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ name: `Smoke Test Latte ${Date.now()}`, category: "Kafe", price: 3 }),
  });
  assert(createMenuItem.status === 201, "create menu item");
  const menuItemId = createMenuItem.body.id as string;

  const createRecipe = await api("/recipes", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ menuItemId, ingredientId, quantity: 0.5 }),
  });
  assert(createRecipe.status === 201, "create recipe (0.5L per unit)");

  const duplicateRecipe = await api("/recipes", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ menuItemId, ingredientId, quantity: 0.5 }),
  });
  assert(duplicateRecipe.status === 409, "duplicate recipe link rejected with 409");

  const sale = await api("/sales", { method: "POST", token: staffToken, body: JSON.stringify({ menuItemId, quantity: 2 }) });
  assert(sale.status === 201, "record sale of 2 units (needs 1.0L)");

  const ingredientAfterSale = await api(`/ingredients/${ingredientId}`, { token: adminToken });
  assert(ingredientAfterSale.status === 200 && Number(ingredientAfterSale.body.stockQty) === 4, `stock decremented to 4 (got ${ingredientAfterSale.body?.stockQty})`);

  const movements = await api(`/stock-movements?ingredientId=${ingredientId}`, { token: adminToken });
  const outMovement = (movements.body as any[])?.find((m) => m.type === "OUT");
  assert(!!outMovement, "StockMovement(type=OUT) was created for the sale");

  console.log("\nInsufficient stock handling");
  const tooMuch = await api("/sales", { method: "POST", token: staffToken, body: JSON.stringify({ menuItemId, quantity: 100 }) });
  assert(tooMuch.status === 409 && tooMuch.body?.error === "INSUFFICIENT_STOCK", "oversized sale rejected with 409 INSUFFICIENT_STOCK");

  console.log("\nStock movement RBAC (STAFF limited to IN)");
  const staffLoss = await api("/stock-movements", {
    method: "POST",
    token: staffToken,
    body: JSON.stringify({ ingredientId, type: "LOSS", quantity: 0.1 }),
  });
  assert(staffLoss.status === 403, "STAFF cannot record LOSS movement");

  const staffIn = await api("/stock-movements", {
    method: "POST",
    token: staffToken,
    body: JSON.stringify({ ingredientId, type: "IN", quantity: 2, purchasePrice: 3 }),
  });
  assert(staffIn.status === 201, "STAFF can record IN movement");

  console.log("\nConcurrency: parallel sales must never drive stock negative");
  const concurrencyIngredient = await api("/ingredients", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ name: `Concurrency Syrup ${Date.now()}`, unit: "L", stockQty: 5, costPerUnit: 2, minThreshold: 1 }),
  });
  const concurrencyIngredientId = concurrencyIngredient.body.id as string;

  const concurrencyMenuItem = await api("/menu-items", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ name: `Concurrency Drink ${Date.now()}`, category: "Kafe", price: 2 }),
  });
  const concurrencyMenuItemId = concurrencyMenuItem.body.id as string;

  await api("/recipes", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ menuItemId: concurrencyMenuItemId, ingredientId: concurrencyIngredientId, quantity: 1 }),
  });

  // Stock = 5, each sale needs 1L, fire 20 concurrent sales of qty=1 -> at most 5 should succeed.
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      api("/sales", { method: "POST", token: staffToken, body: JSON.stringify({ menuItemId: concurrencyMenuItemId, quantity: 1 }) }),
    ),
  );
  const successes = results.filter((r) => r.status === 201).length;
  const rejections = results.filter((r) => r.status === 409).length;
  assert(successes === 5, `exactly 5 of 20 concurrent sales succeeded (got ${successes})`);
  assert(rejections === 15, `remaining 15 rejected with 409 (got ${rejections})`);

  const finalStock = await api(`/ingredients/${concurrencyIngredientId}`, { token: adminToken });
  assert(Number(finalStock.body.stockQty) === 0, `final stock is exactly 0, never negative (got ${finalStock.body?.stockQty})`);

  const rawCheck = await prisma.$queryRaw<{ stockQty: unknown }[]>`SELECT "stockQty" FROM "Ingredient" WHERE id = ${concurrencyIngredientId}`;
  assert(Number(rawCheck[0].stockQty) >= 0, "DB-level stockQty never negative (raw check)");

  console.log("\nReports");
  const profitability = await api("/reports/profitability", { token: managerToken });
  assert(profitability.status === 200 && Array.isArray(profitability.body), "GET /reports/profitability returns array");

  const lowStock = await api("/reports/low-stock", { token: managerToken });
  assert(lowStock.status === 200 && Array.isArray(lowStock.body), "GET /reports/low-stock returns array");

  const inventoryValue = await api("/reports/inventory-value", { token: managerToken });
  assert(inventoryValue.status === 200 && typeof inventoryValue.body?.totalValue === "string", "GET /reports/inventory-value returns totalValue");

  const topItems = await api("/reports/top-items?metric=profit&n=3", { token: managerToken });
  assert(topItems.status === 200 && Array.isArray(topItems.body), "GET /reports/top-items returns array");

  const usage = await api(`/reports/ingredient-usage/${ingredientId}`, { token: managerToken });
  assert(usage.status === 200 && Array.isArray(usage.body), "GET /reports/ingredient-usage/:id returns array");

  console.log("\nExports");
  const csvRes = await fetch(`${BASE_URL}/reports/profitability?format=csv`, { headers: { Authorization: `Bearer ${managerToken}` } });
  assert(csvRes.status === 200 && (csvRes.headers.get("content-type") ?? "").includes("text/csv"), "CSV export returns text/csv");
  const csvBody = await csvRes.text();
  assert(csvBody.length > 0, "CSV export body is non-empty");

  const pdfRes = await fetch(`${BASE_URL}/reports/profitability?format=pdf`, { headers: { Authorization: `Bearer ${managerToken}` } });
  assert(pdfRes.status === 200 && (pdfRes.headers.get("content-type") ?? "").includes("application/pdf"), "PDF export returns application/pdf");
  const pdfBody = await pdfRes.arrayBuffer();
  assert(pdfBody.byteLength > 0, "PDF export body is non-empty");

  console.log("\nLow-stock cron function");
  const alerts = await runLowStockCheck();
  assert(
    alerts.some((a) => a.restaurantId === restaurant.id),
    "low-stock check flags at least one alert for the seeded restaurant",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Smoke test crashed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
