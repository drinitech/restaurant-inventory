import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid request", details: result.error.flatten() });
      return;
    }
    req[source] = result.data;
    next();
  };
}
