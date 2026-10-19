import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Briefcase, ChatCircleDots } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { EmptyState, LoadingState, QueryError } from "~/components/page-state"
import { api, formatDate, formatMoney, type Page, type Project } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { t } = useTranslation()
  const projects = useQuery({ queryKey: ["projects", "mine"], queryFn: () => api.get<Page<Project>>("/projects?limit=100"), enabled: Boolean(user) })
  if (authLoading) return <LoadingState label={t("Opening your projects")} />
  if (!user) return <Navigate to="/login?next=%2Fprojects" replace />
  return <div className="page-container">
    <div className="page-heading-row"><div><p className="section-kicker">{t("YOUR WORKSPACE")}</p><h1>{t("Projects in")} <em>{t("motion.")}</em></h1><p>{t("Keep agreements, conversations, and delivery updates together.")}</p></div></div>
    {projects.isLoading ? <LoadingState label={t("Loading your projects")} /> : projects.isError ? <QueryError error={projects.error} retry={() => void projects.refetch()} /> : projects.data?.data.length ? <div className="project-card-grid">{projects.data.data.map((project) => <Link to={`/projects/${project.id}`} className="project-card" key={project.id}>
      <div className="project-card-top"><span className="project-card-icon"><Briefcase size={21} /></span><span className={`project-status status-${project.status}`}>{t(project.status.replaceAll("_", " "))}</span></div>
      <h2>{project.job?.title ?? "Archer project"}</h2><p className="project-counterparty">{t("Working with")} {project.clientId === user.id ? (project.freelancer?.name ?? t("your freelancer")) : (project.client?.name ?? t("your client"))}</p>
      <div className="project-card-meta"><strong>{formatMoney(project.amountMinor, project.currency)}</strong><span><ChatCircleDots size={16} /> {project._count?.messages ?? 0} {t("messages")}</span></div>
      <div className="project-card-bottom"><span>{t("Updated")} {formatDate(project.updatedAt)}</span><ArrowRight size={17} /></div>
    </Link>)}</div> : <EmptyState title={t("No projects yet")} description={t("When a client hires you or accepts a proposal, the project workspace will appear here.")} action={<Link to="/jobs" className="button-primary">{t("Explore opportunities")} <ArrowRight size={16} /></Link>} />}
  </div>
}
