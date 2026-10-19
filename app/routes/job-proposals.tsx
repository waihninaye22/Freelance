import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Check, Clock, UserCircle } from "@phosphor-icons/react"
import { Link, Navigate, useParams } from "react-router"
import { Button } from "~/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { api, errorMessage, formatDate, formatMoney, type Job, type Page, type Proposal, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"

type CandidateProposal = Proposal & { freelancer?: { id: string; name: string; freelancerProfile?: { headline?: string | null; bio?: string | null; location?: string | null; skills?: { skill: { name: string } }[] } } }

export default function JobProposalsPage() {
  const { jobId = "" } = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const jobKey = ["jobs", jobId]
  const proposalKey = ["job-proposals", jobId]
  const job = useQuery({ queryKey: jobKey, queryFn: () => api.get<Result<Job>>(`/jobs/${jobId}`), enabled: Boolean(user && jobId) })
  const proposals = useQuery({ queryKey: proposalKey, queryFn: () => api.get<Page<CandidateProposal>>(`/jobs/${jobId}/proposals?limit=100`), enabled: Boolean(user && jobId) })
  const action = useMutation({ mutationFn: ({ proposalId, action }: { proposalId: string; action: "shortlist" | "reject" | "hire" }) => api.post<Result<{ id: string }>>(`/proposals/${proposalId}/${action}`), onSuccess: async (result, variables) => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: proposalKey }), queryClient.invalidateQueries({ queryKey: jobKey }), queryClient.invalidateQueries({ queryKey: ["notifications"] }), queryClient.invalidateQueries({ queryKey: ["projects", "mine"] })])
    if (variables.action === "hire") window.location.assign(`/projects/${result.data.id}`)
  } })
  if (authLoading) return <LoadingState label="Opening job proposals" />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/jobs/${jobId}/proposals`)}`} replace />
  if (job.isLoading) return <LoadingState label="Loading job details" />
  if (job.isError) return <div className="page-container"><ErrorState error={job.error} retry={() => void job.refetch()} /></div>
  if (!job.data?.data || job.data.data.client?.id !== user.id) return <div className="page-container"><EmptyState title="This job workspace is private" description="Only the client who posted this job can review its proposals." action={<Link to="/jobs" className="button-outline">Back to opportunities</Link>} /></div>
  const openJob = job.data.data.status === "open"
  return <div className="page-container"><Link to={`/jobs/${jobId}`} className="back-link"><ArrowLeft size={16} /> Back to job</Link><div className="page-heading-row"><div><p className="section-kicker">CLIENT WORKSPACE</p><h1>People who <em>raised a hand.</em></h1><p>{job.data.data.title} · {proposals.data?.pagination.total ?? "—"} proposals</p></div><span className={`project-status status-${job.data.data.status}`}>{job.data.data.status}</span></div>
    {proposals.isLoading ? <LoadingState label="Loading proposals" /> : proposals.isError ? <ErrorState error={proposals.error} retry={() => void proposals.refetch()} /> : proposals.data?.data.length ? <div className="candidate-list">{proposals.data.data.map((proposal) => {
      const candidate = proposal.freelancer
      const profile = candidate?.freelancerProfile
      const reviewable = openJob && ["pending", "shortlisted"].includes(proposal.status)
      return <article className="candidate-card" key={proposal.id}><div className="candidate-top"><div className="candidate-person"><span className="avatar avatar-large"><UserCircle size={25} /></span><div><h2>{candidate ? <Link to={`/profiles/${candidate.id}`}>{candidate.name}</Link> : "Freelancer"}</h2><p>{profile?.headline ?? "Freelancer on Archer"}{profile?.location ? ` · ${profile.location}` : ""}</p></div></div><span className={`project-status status-${proposal.status}`}>{proposal.status}</span></div>
        <p className="candidate-message">{proposal.coverMessage}</p>{profile?.bio && <p className="candidate-bio">{profile.bio}</p>}
        {profile?.skills?.length ? <div className="skill-list">{profile.skills.slice(0, 8).map(({ skill }) => <span className="skill-tag" key={skill.name}>{skill.name}</span>)}</div> : null}
        <div className="candidate-footer"><div className="candidate-quote"><strong>{formatMoney(proposal.amountMinor, proposal.currency)}</strong>{proposal.estimatedDurationDays && <span><Clock size={14} /> {proposal.estimatedDurationDays} days</span>}<span>Sent {formatDate(proposal.createdAt)}</span></div>{reviewable && <div className="candidate-actions">{proposal.status === "pending" && <Button variant="outline" onClick={() => action.mutate({ proposalId: proposal.id, action: "shortlist" })} disabled={action.isPending}>Shortlist</Button>}<button className="text-button danger-text" onClick={() => action.mutate({ proposalId: proposal.id, action: "reject" })} disabled={action.isPending}>Decline</button><Button onClick={() => action.mutate({ proposalId: proposal.id, action: "hire" })} disabled={action.isPending}>Hire <Check size={16} /></Button></div>}</div>
      </article>
    })}</div> : <EmptyState title="No proposals just yet" description="When freelancers apply, their proposals will appear here for you to review." action={<Link to={`/jobs/${jobId}`} className="button-outline">View job listing <ArrowRight size={16} /></Link>} />}
    {action.isError && <div className="form-error">{errorMessage(action.error)}</div>}
  </div>
}
