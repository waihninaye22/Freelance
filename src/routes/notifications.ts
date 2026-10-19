import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, paginated, parsePagination, requireValue, routeParam } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/unread-count", asyncHandler(async (req, res) => {
  const unreadCount = await prisma.notification.count({ where: { userId: req.authUser!.id, readAt: null } });
  res.json({ data: { unreadCount } });
}));

notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { userId: req.authUser!.id };
  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.notification.count({ where }),
  ]);
  res.json(paginated(data, total, page, limit));
}));

notificationsRouter.post("/:notificationId/read", asyncHandler(async (req, res) => {
  const notification = requireValue(await prisma.notification.findUnique({ where: { id: routeParam(req.params.notificationId, "notification ID") } }));
  if (notification.userId !== req.authUser!.id) throw new HttpError(403, "This notification belongs to another user", "FORBIDDEN");
  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { readAt: notification.readAt ?? new Date() } });
  res.json({ data: updated });
}));

notificationsRouter.post("/read-all", asyncHandler(async (_req, res) => {
  const { count } = await prisma.notification.updateMany({ where: { userId: _req.authUser!.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ data: { updated: count } });
}));
