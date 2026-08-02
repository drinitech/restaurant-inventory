import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { ingredientsRouter } from "./modules/ingredients/ingredients.routes.js";
import { menuItemsRouter } from "./modules/menuItems/menuItems.routes.js";
import { recipesRouter } from "./modules/recipes/recipes.routes.js";
import { stockMovementsRouter } from "./modules/stockMovements/stockMovements.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ level: env.NODE_ENV === "production" ? "info" : "warn" }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth/login", authLimiter);
  app.use("/auth/register", authLimiter);
  app.use("/auth", authRouter);
  app.use("/ingredients", ingredientsRouter);
  app.use("/menu-items", menuItemsRouter);
  app.use("/recipes", recipesRouter);
  app.use("/stock-movements", stockMovementsRouter);
  app.use("/sales", salesRouter);
  app.use("/reports", reportsRouter);
  app.use("/users", usersRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
