import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BookmarkSimple, Briefcase, ChatCircleDots, ClipboardText, Plus, Sparkle } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { Button } from "~/components/ui/button"
import { JobCard } from "~/components/job-card"
import { EmptyState, LoadingState } from "~/components/page-state"
import { api, type Page, type Project, type Proposal, type Result, type User } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { t } = useTranslation()
  const projects = useQuery({ queryKey: ["projects", "mine"], queryFn: () => api.get<Page<Project>>("/projects?limit=5"), enabled: Boolean(user) })
  const proposals = useQuery({ queryKey: ["proposals", "mine"], queryFn: () => api.get<Page<Proposal>>("/proposals/mine?limit=5"), enabled: Boolean(user?.freelancerProfile) })
  const saved = useQuery({ queryKey: ["saved-jobs", "preview"], queryFn: () => api.get<Page<unknown>>("/saved-jobs?limit=1"), enabled: Boolean(user) })
  if (isLoading) return <LoadingState label={t("Opening your workspace")} />
  if (!user) return <Navigate to="/login?next=%2Fdashboard" replace />
  const hello = user.name.split(" ")[0]
  const isFreelancer = Boolean(user.freelancerProfile)
  const isClient = Boolean(user.clientProfile)
  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-welcome"><div><p className="section-kicker">{t("YOUR ARCHER WORKSPACE")}</p><h1>{t("Good to see you,")} <em>{hello}.</em></h1><p>{t("Here’s what’s moving on Archer today.")}</p></div><div className="dashboard-actions">{isClient && <Link to="/post-job" className="button-primary"><Plus size={17} /> {t("Post a job")}</Link>}<Link to="/settings/profile" className="button-outline">{t("Edit profile")}</Link></div></div>
      {!isFreelancer && !isClient && <div className="setup-banner"><span className="setup-icon"><Sparkle size={21} /></span><div><strong>{t("Finish setting up Archer")}</strong><p>{t("Add a client or freelancer profile to unlock the workspaces you need.")}</p></div><Link to="/settings/profile" className="text-link">{t("Set up profile")} <ArrowRight size={16} /></Link></div>}
      <div className="stat-grid"><div className="stat-card"><span className="stat-icon"><Briefcase size={19} /></span><span className="stat-label">{t("ACTIVE PROJECTS")}</span><strong>{projects.data?.data.filter((item) => item.status === "active" || item.status === "submitted").length ?? "—"}</strong><small>{t("Projects in progress")}</small></div>{isFreelancer && <div className="stat-card"><span className="stat-icon stat-icon-peach"><ClipboardText size={19} /></span><span className="stat-label">{t("PROPOSALS SENT")}</span><strong>{proposals.data?.pagination.total ?? "—"}</strong><small>{t("Applications across open work")}</small></div>}<div className="stat-card"><span className="stat-icon stat-icon-lilac"><BookmarkSimple size={19} /></span><span className="stat-label">{t("SAVED OPPORTUNITIES")}</span><strong>{saved.data?.pagination.total ?? "—"}</strong><small>{t("Work you’re keeping an eye on")}</small></div></div>
      <div className="dashboard-grid">
        <section className="dashboard-panel"><div className="panel-heading"><div><p className="section-kicker">{t("IN MOTION")}</p><h2>{t("Your projects")}</h2></div><Link to="/projects" className="text-link">{t("View all")} <ArrowRight size={15} /></Link></div>{projects.isLoading ? <LoadingState label={t("Loading projects")} /> : projects.data?.data.length ? <div className="project-list">{projects.data.data.slice(0, 4).map((project) => <Link className="project-row" to={`/projects/${project.id}`} key={project.id}><div className="project-row-icon"><Briefcase size={19} /></div><div className="project-row-copy"><strong>{project.job?.title ?? "Archer project"}</strong><span>{project.clientId === user.id ? `With ${project.freelancer?.name ?? "your freelancer"}` : `With ${project.client?.name ?? "your client"}`}</span></div><span className={`project-status status-${project.status}`}>{project.status.replaceAll("_", " ")}</span><ArrowRight size={16} className="row-arrow" /></Link>)}</div> : <EmptyState title={t("Your first project starts here")} description={t("Find a project that fits your strengths or post a brief to meet the right freelancer.")} action={<Link className="button-outline" to={isClient ? "/post-job" : "/jobs"}>{t(isClient ? "Post a job" : "Explore work")}</Link>} />}</section>
        <aside className="dashboard-side-panel"><div className="side-panel-top"><span className="side-panel-art"><ChatCircleDots size={25} weight="duotone" /></span><p className="section-kicker">{t("KEEP THINGS MOVING")}</p><h2>{t("Good work starts with a conversation.")}</h2><p>{t("Once you find your match, keep project details and updates in one place.")}</p><Link to="/projects" className="text-link">{t("Open your projects")} <ArrowRight size={15} /></Link></div><div className="currency-note"><span className="currency-note-icon">◎</span><p>{t("Your project agreements keep the original USD or MMK amount. Archer doesn’t process payments.")}</p></div></aside>
      </div>
      {isFreelancer && <section className="dashboard-recent"><div className="panel-heading"><div><p className="section-kicker">{t("YOUR APPLICATIONS")}</p><h2>{t("Recent proposals")}</h2></div><Link to="/proposals" className="text-link">{t("All proposals")} <ArrowRight size={15} /></Link></div>{proposals.data?.data.length ? <div className="proposal-mini-list">{proposals.data.data.slice(0, 3).map((proposal) => <Link to="/proposals" className="proposal-mini" key={proposal.id}><span className="proposal-mini-icon"><ClipboardText size={18} /></span><span><strong>{proposal.job?.title ?? "Job proposal"}</strong><small>{proposal.job?.category?.name ?? "Opportunity"}</small></span><span className={`project-status status-${proposal.status}`}>{t(proposal.status)}</span><ArrowRight size={15} className="row-arrow" /></Link>)}</div> : <p className="muted-copy">{t("You haven’t sent a proposal yet. ")}<Link to="/jobs">{t("Find work that fits →")}</Link></p>}</section>}
      {user.isAdmin && <div className="admin-note"><strong>{t("Administrator account")}</strong><span>{t("Review reports and record moderation decisions in the admin workspace.")}</span><Link to="/admin/moderation" className="text-link">{t("Open moderation")} <ArrowRight size={15} /></Link></div>}
    </div>
  )
}
