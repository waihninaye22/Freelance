import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Eye, PencilSimple, Plus, Users } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { Button } from "~/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { api, errorMessage, formatDate, formatMoney, type Job, type Page } from "~/lib/api"
import { useAuth } from "~/lib/auth"

export default function MyJobsPage() {
  const { user, isLoading } = useAuth()
  const queryClient = useQueryClient()
  const key = ["jobs", "mine"]
  const jobs = useQuery({ queryKey: key, queryFn: () => api.get<Page<Job>>("/jobs/mine?limit=100"), enabled: Boolean(user?.clientProfile) })
  const status = useMutation({ mutationFn: ({ id, action }: { id: string; action: "publish" | "pause" | "close" }) => api.post(`/jobs/${id}/${action}`), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({ queryKey: ["jobs"] })]) } })
  if (isLoading) return <LoadingState label="Opening your listings" />
  if (!user) return <Navigate to="/login?next=%2Fmy-jobs" replace />
  if (!user.clientProfile) return <div className="page-container"><EmptyState title="Set up your client profile" description="Your job listings will appear here once you add a client profile." action={<Link to="/settings/profile" className="button-primary">Set up profile</Link>} /></div>
  return <div className="page-container"><div className="page-heading-row"><div><p className="section-kicker">CLIENT WORKSPACE</p><h1>Opportunities you’ve <em>shared.</em></h1><p>Manage listings and review the people interested in your work.</p></div><Link to="/post-job" className="button-primary"><Plus size={17} /> Post a job</Link></div>
    {jobs.isLoading ? <LoadingState label="Loading your job listings" /> : jobs.isError ? <ErrorState error={jobs.error} retry={() => void jobs.refetch()} /> : jobs.data?.data.length ? <div className="managed-job-list">{jobs.data.data.map((job) => <article className="managed-job-card" key={job.id}><div className="managed-job-main"><div className="managed-job-heading"><div><p className="job-meta">{job.category?.name ?? "Opportunity"} <span className="meta-dot" /> Updated {formatDate(job.updatedAt ?? job.createdAt)}</p><h2>{job.title}</h2></div><span className={`project-status status-${job.status}`}>{job.status}</span></div><p className="managed-job-description">{job.description}</p><div className="managed-job-meta"><strong>{job.minAmountMinor || job.maxAmountMinor ? `${formatMoney(job.minAmountMinor ?? job.maxAmountMinor!, job.currency)}${job.maxAmountMinor && job.minAmountMinor && job.maxAmountMinor !== job.minAmountMinor ? ` – ${formatMoney(job.maxAmountMinor, job.currency)}` : ""}` : job.currency}</strong><span><Users size={15} /> {job._count?.proposals ?? 0} proposals</span><span>{job.budgetType === "fixed" ? "Fixed price" : "Hourly"}</span></div></div><div className="managed-job-actions"><Link to={`/jobs/${job.id}`} className="icon-button" aria-label="View listing"><Eye size={18} /></Link>{["draft", "open", "paused"].includes(job.status) && <Link to={`/jobs/${job.id}/edit`} className="icon-button" aria-label="Edit listing"><PencilSimple size={18} /></Link>}{["open", "paused"].includes(job.status) && <Link to={`/jobs/${job.id}/proposals`} className="button-outline"><Users size={15} /> Proposals</Link>}{job.status === "open" && <Button variant="outline" onClick={() => status.mutate({ id: job.id, action: "pause" })} disabled={status.isPending}>Pause</Button>}{["paused", "draft"].includes(job.status) && <Button onClick={() => status.mutate({ id: job.id, action: "publish" })} disabled={status.isPending}>{job.status === "draft" ? "Publish" : "Reopen"}</Button>}{["open", "paused"].includes(job.status) && <button className="text-button danger-text" onClick={() => status.mutate({ id: job.id, action: "close" })} disabled={status.isPending}>Close</button>}</div></article>)}</div> : <EmptyState title="No job listings yet" description="Post a clear brief and let the right people find you." action={<Link to="/post-job" className="button-primary">Post your first job <ArrowRight size={16} /></Link>} />}
    {status.isError && <div className="form-error">{errorMessage(status.error)}</div>}
  </div>
}
