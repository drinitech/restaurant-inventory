import type { NextFunction, Request, Response } from "express";
import type { Role } from "@restaurant-inventory/shared";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError.js";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
