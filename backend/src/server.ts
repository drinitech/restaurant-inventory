import cron from "node-cron";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { runLowStockCheck } from "./jobs/lowStockCheck.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`backend listening on http://localhost:${env.PORT}`);
});

cron.schedule(env.CRON_LOW_STOCK_SCHEDULE, () => {
  runLowStockCheck().catch((err) => console.error("low-stock check failed", err));
});
