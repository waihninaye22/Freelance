import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
  layout("routes/app-layout.tsx", [
    index("routes/home.tsx"),
    route("jobs", "routes/jobs.tsx"),
    route("post-job", "routes/post-job.tsx"),
    route("my-jobs", "routes/my-jobs.tsx"),
    route("jobs/:jobId/edit", "routes/edit-job.tsx"),
    route("jobs/:jobId", "routes/job-detail.tsx"),
    route("jobs/:jobId/proposals", "routes/job-proposals.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("settings/profile", "routes/profile-settings.tsx"),
    route("profiles/:userId", "routes/public-profile.tsx"),
    route("saved", "routes/saved.tsx"),
    route("proposals", "routes/proposals.tsx"),
    route("projects", "routes/projects.tsx"),
    route("projects/:projectId", "routes/project-detail.tsx"),
    route("notifications", "routes/notifications.tsx"),
    route("admin/moderation", "routes/admin-moderation.tsx"),
  ]),
] satisfies RouteConfig
