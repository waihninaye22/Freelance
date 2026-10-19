import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, paginated, parsePagination, requireValue, routeParam } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const savedJobsRouter = Router();
savedJobsRouter.use(requireAuth);

savedJobsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { userId: req.authUser!.id };
  const [items, total] = await Promise.all([
    prisma.savedJob.findMany({ where, include: { job: { include: { category: true, skills: { include: { skill: true } }, client: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.savedJob.count({ where }),
  ]);
  res.json(paginated(items.map((item) => ({ ...item.job, savedAt: item.createdAt })), total, page, limit));
}));

savedJobsRouter.put("/:jobId", asyncHandler(async (req, res) => {
  const job = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (job.status !== "open") throw new HttpError(409, "Only open jobs can be saved", "JOB_CLOSED");
  const saved = await prisma.savedJob.upsert({ where: { userId_jobId: { userId: req.authUser!.id, jobId: job.id } }, create: { userId: req.authUser!.id, jobId: job.id }, update: {} });
  res.status(201).json({ data: saved });
}));

savedJobsRouter.delete("/:jobId", asyncHandler(async (req, res) => {
  await prisma.savedJob.deleteMany({ where: { userId: req.authUser!.id, jobId: routeParam(req.params.jobId, "job ID") } });
  res.status(204).end();
}));
