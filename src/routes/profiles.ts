import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, routeParam } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const profilesRouter = Router();

profilesRouter.get("/:userId", asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: routeParam(req.params.userId, "user ID"), isActive: true },
    select: {
      id: true, name: true, createdAt: true,
      freelancerProfile: { include: { skills: { include: { skill: true } }, portfolioLinks: true } },
      clientProfile: true,
      _count: { select: { freelancerProjects: { where: { status: "completed" } }, reviewsReceived: true } },
    },
  });
  if (!user) throw new HttpError(404, "Profile not found", "NOT_FOUND");
  res.json({ data: user });
}));

profilesRouter.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    freelancer: z.object({
      headline: z.string().max(120).nullable().optional(), bio: z.string().max(4000).nullable().optional(),
      location: z.string().max(120).nullable().optional(), timeZone: z.string().max(80).nullable().optional(),
      hourlyRateMinor: z.number().int().nonnegative().nullable().optional(), rateCurrency: z.enum(["USD", "MMK"]).nullable().optional(),
      skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
      portfolioLinks: z.array(z.object({ label: z.string().trim().min(1).max(80), url: z.string().url().max(500) })).max(20).optional(),
    }).optional(),
    client: z.object({ displayName: z.string().trim().min(1).max(120).optional(), description: z.string().max(2000).nullable().optional(), location: z.string().max(120).nullable().optional() }).optional(),
  }).refine((value) => Object.keys(value).length > 0, "Provide at least one field").parse(req.body);

  const userId = req.authUser!.id;
  await prisma.$transaction(async (tx) => {
    if (input.name) await tx.user.update({ where: { id: userId }, data: { name: input.name } });
    if (input.freelancer) {
      const { skills, portfolioLinks, ...fields } = input.freelancer;
      const profile = await tx.freelancerProfile.upsert({ where: { userId }, create: { userId }, update: fields });
      if (skills) {
        const skillRecords = await Promise.all(skills.map((name) => tx.skill.upsert({ where: { name }, create: { name }, update: {} })));
        await tx.freelancerSkill.deleteMany({ where: { profileId: profile.id } });
        if (skillRecords.length) await tx.freelancerSkill.createMany({ data: skillRecords.map((skill) => ({ profileId: profile.id, skillId: skill.id })) });
      }
      if (portfolioLinks) {
        await tx.portfolioLink.deleteMany({ where: { profileId: profile.id } });
        if (portfolioLinks.length) await tx.portfolioLink.createMany({ data: portfolioLinks.map((link) => ({ ...link, profileId: profile.id })) });
      }
    }
    if (input.client) {
      const existing = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
      await tx.clientProfile.upsert({ where: { userId }, create: { userId, displayName: input.client.displayName ?? existing!.name, ...input.client }, update: input.client });
    }
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, freelancerProfile: { include: { skills: { include: { skill: true } }, portfolioLinks: true } }, clientProfile: true } });
  res.json({ data: user });
}));
