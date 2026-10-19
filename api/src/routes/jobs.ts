import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, paginated, parsePagination, requireValue, routeParam } from "../lib/http.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const jobsRouter = Router();
const currencies = z.enum(["USD", "MMK"]);
const jobBaseInput = z.object({
  title: z.string().trim().min(8).max(140), description: z.string().trim().min(30).max(10000),
  categoryId: z.string().min(1), budgetType: z.enum(["fixed", "hourly"]),
  minAmountMinor: z.number().int().positive().nullable().optional(), maxAmountMinor: z.number().int().positive().nullable().optional(),
  currency: currencies, experienceLevel: z.enum(["entry", "intermediate", "expert"]).nullable().optional(), skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});
const jobInput = jobBaseInput.superRefine((data, ctx) => {
  if (data.minAmountMinor && data.maxAmountMinor && data.minAmountMinor > data.maxAmountMinor) ctx.addIssue({ code: "custom", path: ["maxAmountMinor"], message: "Maximum must be at least the minimum" });
});

const jobInclude = { category: true, skills: { include: { skill: true } }, client: { select: { id: true, name: true, clientProfile: true } }, _count: { select: { proposals: true } } } satisfies Prisma.JobInclude;

jobsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where: Prisma.JobWhereInput = { status: "open" };
  if (typeof req.query.q === "string" && req.query.q.trim()) where.OR = [{ title: { contains: req.query.q.trim() } }, { description: { contains: req.query.q.trim() } }];
  if (typeof req.query.categoryId === "string") where.categoryId = req.query.categoryId;
  if (req.query.currency === "USD" || req.query.currency === "MMK") where.currency = req.query.currency;
  if (req.query.budgetType === "fixed" || req.query.budgetType === "hourly") where.budgetType = req.query.budgetType;
  if (typeof req.query.skill === "string") where.skills = { some: { skill: { name: { contains: req.query.skill } } } };
  if (typeof req.query.experienceLevel === "string") where.experienceLevel = req.query.experienceLevel;
  const [data, total] = await Promise.all([
    prisma.job.findMany({ where, include: jobInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.job.count({ where }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

jobsRouter.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where: Prisma.JobWhereInput = { clientId: req.authUser!.id };
  if (typeof req.query.status === "string" && ["draft", "open", "paused", "closed"].includes(req.query.status)) where.status = req.query.status;
  const [data, total] = await Promise.all([
    prisma.job.findMany({ where, include: jobInclude, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.job.count({ where }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

jobsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  if (!await prisma.clientProfile.findUnique({ where: { userId: req.authUser!.id } })) throw new HttpError(403, "Create a client profile before posting a job", "CLIENT_PROFILE_REQUIRED");
  const input = jobInput.parse(req.body);
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new HttpError(400, "Unknown category", "INVALID_CATEGORY");
  const job = await prisma.job.create({
    data: {
      clientId: req.authUser!.id, title: input.title, description: input.description, categoryId: input.categoryId,
      budgetType: input.budgetType, minAmountMinor: input.minAmountMinor, maxAmountMinor: input.maxAmountMinor,
      currency: input.currency, experienceLevel: input.experienceLevel,
      skills: { create: await Promise.all(input.skills.map(async (name) => ({ skill: { connectOrCreate: { where: { name }, create: { name } } } }))) },
    }, include: jobInclude,
  });
  res.status(201).json({ data: job });
}));

jobsRouter.get("/:jobId", optionalAuth, asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") }, include: jobInclude });
  if (!job || (job.status !== "open" && req.authUser?.id !== job.clientId && !req.authUser?.isAdmin)) throw new HttpError(404, "Job not found", "NOT_FOUND");
  res.json({ data: job });
}));

jobsRouter.patch("/:jobId", requireAuth, asyncHandler(async (req, res) => {
  const existing = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (existing.clientId !== req.authUser!.id) throw new HttpError(403, "Only the job owner can edit this job", "FORBIDDEN");
  if (!["draft", "open", "paused"].includes(existing.status)) throw new HttpError(409, "This job can no longer be edited", "INVALID_STATE");
  const input = jobBaseInput.partial().parse(req.body);
  const skills = input.skills;
  const { skills: _skills, ...fields } = input;
  const data: Prisma.JobUpdateInput = { ...fields };
  if (skills) data.skills = { deleteMany: {}, create: await Promise.all(skills.map(async (name) => ({ skill: { connectOrCreate: { where: { name }, create: { name } } } }))) };
  const job = await prisma.job.update({ where: { id: existing.id }, data, include: jobInclude });
  res.json({ data: job });
}));

const changeJobStatus = asyncHandler(async (req, res) => {
  const job = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (job.clientId !== req.authUser!.id) throw new HttpError(403, "Only the job owner can change its status", "FORBIDDEN");
  const action = req.path.split("/").at(-1)!;
  const transition: Record<string, { from: string[]; to: string }> = {
    publish: { from: ["draft", "paused"], to: "open" }, pause: { from: ["open"], to: "paused" }, close: { from: ["open", "paused"], to: "closed" },
  };
  const rule = transition[action]!;
  if (!rule.from.includes(job.status)) throw new HttpError(409, `Cannot ${action} a ${job.status} job`, "INVALID_STATE");
  const updated = await prisma.job.update({ where: { id: job.id }, data: { status: rule.to }, include: jobInclude });
  res.json({ data: updated });
});
jobsRouter.post("/:jobId/publish", requireAuth, changeJobStatus);
jobsRouter.post("/:jobId/pause", requireAuth, changeJobStatus);
jobsRouter.post("/:jobId/close", requireAuth, changeJobStatus);

jobsRouter.delete("/:jobId", requireAuth, asyncHandler(async (req, res) => {
  const job = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (job.clientId !== req.authUser!.id) throw new HttpError(403, "Only the job owner can delete this job", "FORBIDDEN");
  if (!["draft", "paused"].includes(job.status)) throw new HttpError(409, "Only draft or paused jobs can be deleted", "INVALID_STATE");
  await prisma.job.delete({ where: { id: job.id } });
  res.status(204).end();
}));
