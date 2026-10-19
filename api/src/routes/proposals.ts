import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, paginated, parsePagination, requireValue, routeParam } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const proposalsRouter = Router();

proposalsRouter.post("/jobs/:jobId/proposals", requireAuth, asyncHandler(async (req, res) => {
  const input = z.object({ coverMessage: z.string().trim().min(30).max(5000), amountMinor: z.number().int().positive(), currency: z.enum(["USD", "MMK"]), estimatedDurationDays: z.number().int().positive().max(3650).optional() }).parse(req.body);
  const job = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (job.status !== "open") throw new HttpError(409, "This job is not accepting proposals", "JOB_CLOSED");
  if (job.clientId === req.authUser!.id) throw new HttpError(400, "You cannot apply to your own job", "INVALID_ACTION");
  if (!await prisma.freelancerProfile.findUnique({ where: { userId: req.authUser!.id } })) throw new HttpError(403, "Create a freelancer profile before applying", "FREELANCER_PROFILE_REQUIRED");
  if (input.currency !== job.currency) throw new HttpError(400, "Proposal currency must match the job currency", "CURRENCY_MISMATCH");
  const proposal = await prisma.proposal.create({ data: { ...input, jobId: job.id, freelancerId: req.authUser!.id }, include: { freelancer: { select: { id: true, name: true, freelancerProfile: true } }, job: { select: { id: true, title: true } } } });
  await prisma.notification.create({ data: { userId: job.clientId, type: "proposal_received", message: `${proposal.freelancer.name} submitted a proposal for “${job.title}”.`, href: `/jobs/${job.id}/proposals` } });
  res.status(201).json({ data: proposal });
}));

proposalsRouter.get("/jobs/:jobId/proposals", requireAuth, asyncHandler(async (req, res) => {
  const job = requireValue(await prisma.job.findUnique({ where: { id: routeParam(req.params.jobId, "job ID") } }));
  if (job.clientId !== req.authUser!.id && !req.authUser!.isAdmin) throw new HttpError(403, "Only the job owner can view its proposals", "FORBIDDEN");
  const { page, limit, skip } = parsePagination(req.query);
  const [data, total] = await Promise.all([
    prisma.proposal.findMany({ where: { jobId: job.id }, include: { freelancer: { select: { id: true, name: true, freelancerProfile: { include: { skills: { include: { skill: true } } } } } }, project: true }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.proposal.count({ where: { jobId: job.id } }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

proposalsRouter.get("/proposals/mine", requireAuth, asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { freelancerId: req.authUser!.id };
  const [data, total] = await Promise.all([
    prisma.proposal.findMany({ where, include: { job: { include: { category: true, client: { select: { id: true, name: true } } } } }, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.proposal.count({ where }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

proposalsRouter.patch("/proposals/:proposalId", requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.proposal.findUniqueOrThrow({ where: { id: routeParam(req.params.proposalId, "proposal ID") }, include: { job: true } });
  if (existing.freelancerId !== req.authUser!.id) throw new HttpError(403, "Only the proposal author can edit it", "FORBIDDEN");
  if (existing.status !== "pending" || existing.job.status !== "open") throw new HttpError(409, "This proposal can no longer be edited", "INVALID_STATE");
  const input = z.object({ coverMessage: z.string().trim().min(30).max(5000).optional(), amountMinor: z.number().int().positive().optional(), estimatedDurationDays: z.number().int().positive().max(3650).nullable().optional() }).parse(req.body);
  res.json({ data: await prisma.proposal.update({ where: { id: existing.id }, data: input }) });
}));

proposalsRouter.post("/proposals/:proposalId/withdraw", requireAuth, asyncHandler(async (req, res) => {
  const proposal = requireValue(await prisma.proposal.findUnique({ where: { id: routeParam(req.params.proposalId, "proposal ID") } }));
  if (proposal.freelancerId !== req.authUser!.id) throw new HttpError(403, "Only the proposal author can withdraw it", "FORBIDDEN");
  if (!["pending", "shortlisted"].includes(proposal.status)) throw new HttpError(409, "This proposal cannot be withdrawn", "INVALID_STATE");
  res.json({ data: await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "withdrawn" } }) });
}));

const decideProposal = asyncHandler(async (req, res) => {
  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: routeParam(req.params.proposalId, "proposal ID") }, include: { job: true } });
  if (proposal.job.clientId !== req.authUser!.id) throw new HttpError(403, "Only the job owner can review proposals", "FORBIDDEN");
  if (!["pending", "shortlisted"].includes(proposal.status)) throw new HttpError(409, "This proposal is no longer under review", "INVALID_STATE");
  const status = req.path.endsWith("/shortlist") ? "shortlisted" : "rejected";
  const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status } });
  await prisma.notification.create({ data: { userId: proposal.freelancerId, type: `proposal_${status}`, message: `Your proposal for “${proposal.job.title}” was ${status}.`, href: "/proposals" } });
  res.json({ data: updated });
});
proposalsRouter.post("/proposals/:proposalId/shortlist", requireAuth, decideProposal);
proposalsRouter.post("/proposals/:proposalId/reject", requireAuth, decideProposal);

proposalsRouter.post("/proposals/:proposalId/hire", requireAuth, asyncHandler(async (req, res) => {
  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: routeParam(req.params.proposalId, "proposal ID") }, include: { job: true } });
  if (proposal.job.clientId !== req.authUser!.id) throw new HttpError(403, "Only the job owner can hire a freelancer", "FORBIDDEN");
  if (proposal.job.status !== "open" || !["pending", "shortlisted"].includes(proposal.status)) throw new HttpError(409, "This proposal cannot be hired", "INVALID_STATE");
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { jobId: proposal.jobId, proposalId: proposal.id, clientId: proposal.job.clientId, freelancerId: proposal.freelancerId, scopeSummary: proposal.job.description, amountMinor: proposal.amountMinor, currency: proposal.currency } });
    await tx.job.update({ where: { id: proposal.jobId }, data: { status: "closed" } });
    await tx.proposal.update({ where: { id: proposal.id }, data: { status: "hired" } });
    await tx.proposal.updateMany({ where: { jobId: proposal.jobId, id: { not: proposal.id }, status: { in: ["pending", "shortlisted"] } }, data: { status: "rejected" } });
    await tx.notification.createMany({ data: [
      { userId: proposal.freelancerId, type: "hired", message: `You were hired for “${proposal.job.title}”.`, href: `/projects/${created.id}` },
      { userId: proposal.job.clientId, type: "project_created", message: `Your project for “${proposal.job.title}” is ready.`, href: `/projects/${created.id}` },
    ] });
    return created;
  });
  res.status(201).json({ data: project });
}));
