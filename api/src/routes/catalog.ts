import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (_req, res, next) => {
  try { res.json({ data: await prisma.category.findMany({ orderBy: { name: "asc" } }) }); } catch (error) { next(error); }
});

catalogRouter.get("/skills", async (_req, res, next) => {
  try { res.json({ data: await prisma.skill.findMany({ orderBy: { name: "asc" } }) }); } catch (error) { next(error); }
});
