import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, paginated, parsePagination, requireValue, routeParam } from "../lib/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { OR: [{ clientId: req.authUser!.id }, { freelancerId: req.authUser!.id }] };
  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, include: { job: { select: { id: true, title: true } }, client: { select: { id: true, name: true } }, freelancer: { select: { id: true, name: true } }, _count: { select: { messages: true } } }, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.project.count({ where }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

projectsRouter.get("/:projectId", asyncHandler(async (req, res) => {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: routeParam(req.params.projectId, "project ID") }, include: { job: true, proposal: true, client: { select: { id: true, name: true } }, freelancer: { select: { id: true, name: true } }, reviews: true } });
  if (![project.clientId, project.freelancerId].includes(req.authUser!.id) && !req.authUser!.isAdmin) throw new HttpError(403, "You are not a participant in this project", "FORBIDDEN");
  res.json({ data: project });
}));

projectsRouter.post("/:projectId/submit", asyncHandler(async (req, res) => {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: routeParam(req.params.projectId, "project ID") }, include: { job: true } });
  if (project.freelancerId !== req.authUser!.id) throw new HttpError(403, "Only the freelancer can submit this work", "FORBIDDEN");
  if (project.status !== "active") throw new HttpError(409, "Only active work can be submitted", "INVALID_STATE");
  const updated = await prisma.project.update({ where: { id: project.id }, data: { status: "submitted" } });
  await prisma.notification.create({ data: { userId: project.clientId, type: "work_submitted", message: `Work was submitted for “${project.job.title}”.`, href: `/projects/${project.id}` } });
  res.json({ data: updated });
}));

projectsRouter.post("/:projectId/complete", asyncHandler(async (req, res) => {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: routeParam(req.params.projectId, "project ID") }, include: { job: true } });
  if (project.clientId !== req.authUser!.id) throw new HttpError(403, "Only the client can complete this project", "FORBIDDEN");
  if (project.status !== "submitted") throw new HttpError(409, "Work must be submitted before it can be completed", "INVALID_STATE");
  const updated = await prisma.project.update({ where: { id: project.id }, data: { status: "completed" } });
  await prisma.notification.create({ data: { userId: project.freelancerId, type: "project_completed", message: `The project “${project.job.title}” was marked complete.`, href: `/projects/${project.id}` } });
  res.json({ data: updated });
}));

projectsRouter.post("/:projectId/cancel", asyncHandler(async (req, res) => {
  const project = requireValue(await prisma.project.findUnique({ where: { id: routeParam(req.params.projectId, "project ID") } }));
  if (![project.clientId, project.freelancerId].includes(req.authUser!.id)) throw new HttpError(403, "Only project participants can request cancellation", "FORBIDDEN");
  if (!["active", "submitted"].includes(project.status)) throw new HttpError(409, "This project cannot be cancelled in its current state", "INVALID_STATE");
  const updated = await prisma.project.update({ where: { id: project.id }, data: { status: "cancellation_requested" } });
  const otherUserId = req.authUser!.id === project.clientId ? project.freelancerId : project.clientId;
  await prisma.notification.create({ data: { userId: otherUserId, type: "cancellation_requested", message: "A project participant requested cancellation.", href: `/projects/${project.id}` } });
  res.json({ data: updated });
}));

projectsRouter.get("/:projectId/messages", asyncHandler(async (req, res) => {
  const project = requireValue(await prisma.project.findUnique({ where: { id: routeParam(req.params.projectId, "project ID") }, select: { clientId: true, freelancerId: true } }));
  if (![project.clientId, project.freelancerId].includes(req.authUser!.id) && !req.authUser!.isAdmin) throw new HttpError(403, "You are not a participant in this project", "FORBIDDEN");
  const { page, limit, skip } = parsePagination(req.query);
  const projectId = routeParam(req.params.projectId, "project ID");
  const where = { projectId };
  const [messages, total] = await Promise.all([
    prisma.projectMessage.findMany({ where, include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.projectMessage.count({ where }),
  ]);
  res.json(paginated(messages.reverse(), total, page, limit));
}));

projectsRouter.post("/:projectId/messages", asyncHandler(async (req, res) => {
  const input = z.object({ body: z.string().trim().min(1).max(10000) }).parse(req.body);
  const project = requireValue(await prisma.project.findUnique({ where: { id: routeParam(req.params.projectId, "project ID") } }));
  if (![project.clientId, project.freelancerId].includes(req.authUser!.id)) throw new HttpError(403, "Only project participants can send messages", "FORBIDDEN");
  if (["completed", "cancelled"].includes(project.status)) throw new HttpError(409, "This project conversation is closed", "INVALID_STATE");
  const message = await prisma.projectMessage.create({ data: { projectId: project.id, senderId: req.authUser!.id, body: input.body }, include: { sender: { select: { id: true, name: true } } } });
  const recipientId = req.authUser!.id === project.clientId ? project.freelancerId : project.clientId;
  await prisma.notification.create({ data: { userId: recipientId, type: "project_message", message: "You have a new project message.", href: `/projects/${project.id}` } });
  res.status(201).json({ data: message });
}));

projectsRouter.post("/:projectId/reviews", asyncHandler(async (req, res) => {
  const input = z.object({ rating: z.number().int().min(1).max(5), body: z.string().trim().max(2000).optional() }).parse(req.body);
  const project = requireValue(await prisma.project.findUnique({ where: { id: routeParam(req.params.projectId, "project ID") } }));
  if (project.status !== "completed") throw new HttpError(409, "Reviews are available after project completion", "INVALID_STATE");
  let recipientId: string;
  if (req.authUser!.id === project.clientId) recipientId = project.freelancerId;
  else if (req.authUser!.id === project.freelancerId) recipientId = project.clientId;
  else throw new HttpError(403, "Only project participants can leave a review", "FORBIDDEN");
  const review = await prisma.review.create({ data: { projectId: project.id, authorId: req.authUser!.id, recipientId, ...input } });
  res.status(201).json({ data: review });
}));

projectsRouter.post("/admin/:projectId/resolve-cancellation", requireAdmin, asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(["active", "submitted", "cancelled"]), reason: z.string().trim().min(3).max(1000) }).parse(req.body);
  const projectId = routeParam(req.params.projectId, "project ID");
  const project = requireValue(await prisma.project.findUnique({ where: { id: projectId } }));
  if (project.status !== "cancellation_requested") throw new HttpError(409, "This project has no pending cancellation request", "INVALID_STATE");
  const updated = await prisma.$transaction(async (tx) => {
    const resolved = await tx.project.update({ where: { id: project.id }, data: { status: input.status } });
    await tx.adminAuditEvent.create({ data: { actorId: req.authUser!.id, action: "project_cancellation_resolved", targetType: "project", targetId: project.id, details: `${input.status}: ${input.reason}` } });
    await tx.notification.createMany({ data: [project.clientId, project.freelancerId].map((userId) => ({ userId, type: "cancellation_resolved", message: `An administrator resolved the project cancellation request as ${input.status}.`, href: `/projects/${project.id}` })) });
    return resolved;
  });
  res.json({ data: updated });
}));
