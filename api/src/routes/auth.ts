import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { issueAccessToken, publicUser } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
  roles: z.array(z.enum(["freelancer", "client"])).min(1).max(2).default(["freelancer"]),
});

authRouter.post("/register", asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      ...(input.roles.includes("freelancer") ? { freelancerProfile: { create: {} } } : {}),
      ...(input.roles.includes("client") ? { clientProfile: { create: { displayName: input.name } } } : {}),
    },
    include: { freelancerProfile: true, clientProfile: true },
  });
  res.status(201).json({ data: { user: publicUser(user), accessToken: issueAccessToken(user), tokenType: "Bearer", expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" } });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const input = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), password: z.string().min(1) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { freelancerProfile: true, clientProfile: true } });
  if (!user || !user.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect", "INVALID_CREDENTIALS");
  }
  res.json({ data: { user: publicUser(user), accessToken: issueAccessToken(user), tokenType: "Bearer", expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" } });
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id }, include: { freelancerProfile: { include: { skills: { include: { skill: true } }, portfolioLinks: true } }, clientProfile: true } });
  if (!user?.isActive) throw new HttpError(401, "Account is unavailable", "UNAUTHENTICATED");
  res.json({ data: publicUser(user) });
}));

authRouter.post("/logout", requireAuth, (_req, res) => {
  // Access tokens are stateless and expire quickly. Logout is completed by discarding the token on the client.
  res.json({ data: { signedOut: true } });
});
