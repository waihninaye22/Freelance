import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

type TokenPayload = { sub: string; isAdmin: boolean };

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Sign in to continue", "UNAUTHENTICATED"));
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET!) as TokenPayload;
    void prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, isAdmin: true, isActive: true } }).then((user) => {
      if (!user?.isActive) return next(new HttpError(401, "Account is unavailable", "UNAUTHENTICATED"));
      req.authUser = { id: user.id, isAdmin: user.isAdmin };
      next();
    }).catch(next);
  } catch {
    next(new HttpError(401, "Access token is invalid or expired", "UNAUTHENTICATED"));
  }
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header) return next();
  if (!header.startsWith("Bearer ")) return next(new HttpError(401, "Access token is invalid or expired", "UNAUTHENTICATED"));
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET!) as TokenPayload;
    void prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, isAdmin: true, isActive: true } }).then((user) => {
      if (!user?.isActive) return next(new HttpError(401, "Account is unavailable", "UNAUTHENTICATED"));
      req.authUser = { id: user.id, isAdmin: user.isAdmin };
      next();
    }).catch(next);
  } catch {
    next(new HttpError(401, "Access token is invalid or expired", "UNAUTHENTICATED"));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.authUser) return next(new HttpError(401, "Sign in to continue", "UNAUTHENTICATED"));
  if (!req.authUser.isAdmin) return next(new HttpError(403, "Administrator access required", "FORBIDDEN"));
  next();
};
