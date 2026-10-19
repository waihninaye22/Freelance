import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { localizedMessage, requestLocale } from "./i18n.js";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = "REQUEST_FAILED") {
    super(message);
  }
}

export const asyncHandler = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { void fn(req, res).catch(next); };

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const locale = requestLocale(req.header("accept-language"));
  res.vary("Accept-Language");
  if (error instanceof ZodError) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: localizedMessage("Request validation failed", locale), details: error.flatten() } });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: localizedMessage(error.message, locale) } });
  }
  const dbCode = (error as { code?: string })?.code;
  if (dbCode === "P2002") return res.status(409).json({ error: { code: "CONFLICT", message: localizedMessage("A record with that value already exists", locale) } });
  if (dbCode === "P2025") return res.status(404).json({ error: { code: "NOT_FOUND", message: localizedMessage("Record not found", locale) } });
  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: localizedMessage("An unexpected error occurred", locale) } });
}

export function parsePagination(query: Request["query"]) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export function requireValue<T>(value: T | null | undefined, message = "Record not found"): T {
  if (value === null || value === undefined) throw new HttpError(404, message, "NOT_FOUND");
  return value;
}

export function routeParam(value: string | string[] | undefined, name = "route parameter"): string {
  if (typeof value === "string" && value.length > 0) return value;
  throw new HttpError(400, `Invalid ${name}`, "INVALID_PARAMETER");
}
