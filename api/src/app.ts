import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./lib/http.js";
import { localizedMessage, requestLocale } from "./lib/i18n.js";
import { authRouter } from "./routes/auth.js";
import { profilesRouter } from "./routes/profiles.js";
import { catalogRouter } from "./routes/catalog.js";
import { jobsRouter } from "./routes/jobs.js";
import { proposalsRouter } from "./routes/proposals.js";
import { projectsRouter } from "./routes/projects.js";
import { notificationsRouter } from "./routes/notifications.js";
import { savedJobsRouter } from "./routes/saved-jobs.js";
import { reportsRouter } from "./routes/reports.js";

export const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:8081").split(",").map((value) => value.trim());

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ data: { status: "ok", service: "archer-api" } }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false, handler: (req, res) => { res.vary("Accept-Language").status(429).json({ error: { code: "RATE_LIMITED", message: localizedMessage("Too many authentication attempts. Try again later.", requestLocale(req.header("accept-language"))) } }); } });
const api = express.Router();
api.use("/auth/register", authLimiter);
api.use("/auth/login", authLimiter);
api.use("/auth", authRouter);
api.use("/profiles", profilesRouter);
api.use("/catalog", catalogRouter);
api.use("/jobs", jobsRouter);
api.use("/", proposalsRouter);
api.use("/projects", projectsRouter);
api.use("/notifications", notificationsRouter);
api.use("/saved-jobs", savedJobsRouter);
api.use("/reports", reportsRouter);
app.use("/api/v1", api);

app.use((req, res) => res.vary("Accept-Language").status(404).json({ error: { code: "NOT_FOUND", message: localizedMessage("Route not found", requestLocale(req.header("accept-language"))) } }));
app.use(errorHandler);
