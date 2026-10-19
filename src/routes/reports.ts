import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, requireValue, routeParam } from "../lib/http.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  const input = z.object({ targetType: z.enum(["job", "profile", "proposal", "message"]), targetId: z.string().min(1), reason: z.string().trim().min(3).max(120), details: z.string().trim().max(3000).optional() }).parse(req.body);
  const exists = input.targetType === "job" ? await prisma.job.findUnique({ where: { id: input.targetId } })
    : input.targetType === "profile" ? await prisma.user.findUnique({ where: { id: input.targetId } })
      : input.targetType === "proposal" ? await prisma.proposal.findUnique({ where: { id: input.targetId } })
        : await prisma.projectMessage.findUnique({ where: { id: input.targetId } });
  if (!exists) throw new HttpError(404, "Reported item not found", "NOT_FOUND");
  const report = await prisma.report.create({ data: { ...input, reporterId: req.authUser!.id } });
  res.status(201).json({ data: report });
}));

reportsRouter.get("/admin", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const data = await prisma.report.findMany({ where: status ? { status } : undefined, include: { reporter: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" }, take: Math.min(100, Math.max(1, Number(req.query.limit) || 50)) });
  res.json({ data });
}));

reportsRouter.patch("/admin/:reportId", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(["reviewed", "actioned", "dismissed"]), resolution: z.string().trim().min(3).max(1000) }).parse(req.body);
  const report = requireValue(await prisma.report.findUnique({ where: { id: routeParam(req.params.reportId, "report ID") } }));
  const updated = await prisma.$transaction(async (tx) => {
    if (input.status === "actioned" && report.targetType === "job") {
      await tx.job.updateMany({ where: { id: report.targetId }, data: { status: "closed" } });
    }
    if (input.status === "actioned" && report.targetType === "profile") {
      await tx.user.updateMany({ where: { id: report.targetId }, data: { isActive: false } });
    }
    const changed = await tx.report.update({ where: { id: report.id }, data: { status: input.status, resolution: input.resolution, reviewedBy: req.authUser!.id } });
    await tx.adminAuditEvent.create({ data: { actorId: req.authUser!.id, action: `report_${input.status}`, targetType: report.targetType, targetId: report.targetId, details: input.resolution } });
    return changed;
  });
  res.json({ data: updated });
}));

reportsRouter.post("/admin/users/:userId/suspend", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const input = z.object({ reason: z.string().trim().min(3).max(1000) }).parse(req.body);
  const userId = routeParam(req.params.userId, "user ID");
  if (userId === req.authUser!.id) throw new HttpError(400, "You cannot suspend your own account", "INVALID_ACTION");
  const user = requireValue(await prisma.user.update({ where: { id: userId }, data: { isActive: false }, select: { id: true, email: true, isActive: true } }));
  await prisma.adminAuditEvent.create({ data: { actorId: req.authUser!.id, action: "user_suspended", targetType: "user", targetId: user.id, details: input.reason } });
  res.json({ data: user });
}));
