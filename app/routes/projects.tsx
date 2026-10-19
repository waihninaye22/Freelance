import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Briefcase, ChatCircleDots } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { EmptyState, LoadingState, QueryError } from "~/components/page-state"
import { api, formatDate, formatMoney, type Page, type Project } from "~/lib/api"
import { useAuth } from "~/lib/auth"

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const projects = useQuery({ queryKey: ["projects", "mine"], queryFn: () => api.get<Page<Project>>("/projects?limit=100"), enabled: Boolean(user) })
  if (authLoading) return <LoadingState label="Opening your projects" />
  if (!user) return <Navigate to="/login?next=%2Fprojects" replace />
  return <div className="page-container">
    <div className="page-heading-row"><div><p className="section-kicker">YOUR WORKSPACE</p><h1>Projects in <em>motion.</em></h1><p>Keep agreements, conversations, and delivery updates together.</p></div></div>
    {projects.isLoading ? <LoadingState label="Loading your projects" /> : projects.isError ? <QueryError error={projects.error} retry={() => void projects.refetch()} /> : projects.data?.data.length ? <div className="project-card-grid">{projects.data.data.map((project) => <Link to={`/projects/${project.id}`} className="project-card" key={project.id}>
      <div className="project-card-top"><span className="project-card-icon"><Briefcase size={21} /></span><span className={`project-status status-${project.status}`}>{project.status.replaceAll("_", " ")}</span></div>
      <h2>{project.job?.title ?? "Archer project"}</h2><p className="project-counterparty">{project.clientId === user.id ? `Working with ${project.freelancer?.name ?? "your freelancer"}` : `Working with ${project.client?.name ?? "your client"}`}</p>
      <div className="project-card-meta"><strong>{formatMoney(project.amountMinor, project.currency)}</strong><span><ChatCircleDots size={16} /> {project._count?.messages ?? 0} messages</span></div>
      <div className="project-card-bottom"><span>Updated {formatDate(project.updatedAt)}</span><ArrowRight size={17} /></div>
    </Link>)}</div> : <EmptyState title="No projects yet" description="When a client hires you or accepts a proposal, the project workspace will appear here." action={<Link to="/jobs" className="button-primary">Explore opportunities <ArrowRight size={16} /></Link>} />}
  </div>
}
