import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

interface ErrorShape {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

function toErrorShape(err: unknown): ErrorShape {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return { status: 409, code: "UNIQUE_CONSTRAINT", message: "Record already exists", details: err.meta };
    }
    if (err.code === "P2025") {
      return { status: 404, code: "NOT_FOUND", message: "Record not found" };
    }
    if (err.code === "P2003") {
      return { status: 409, code: "REFERENCED_RECORD", message: "This record is referenced by other data and cannot be deleted" };
    }
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "code" in err &&
    "message" in err
  ) {
    const e = err as ErrorShape;
    return { status: e.status, code: e.code, message: e.message, details: e.details };
  }
  return { status: 500, code: "INTERNAL_ERROR", message: "Something went wrong" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const shape = toErrorShape(err);
  if (shape.status >= 500) {
    req.log?.error({ err }, "unhandled error");
  }
  res.status(shape.status).json({ error: shape.code, message: shape.message, details: shape.details });
}
