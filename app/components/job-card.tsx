import { BookmarkSimple, Clock, MapPin, Users } from "@phosphor-icons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { api, formatDate, formatMoney, type Job } from "~/lib/api"
import { useAuth } from "~/lib/auth"

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: () => api.put(`/saved-jobs/${job.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  })
  const amount = job.maxAmountMinor ?? job.minAmountMinor
  return (
    <article className={`job-card ${compact ? "job-card-compact" : ""}`}>
      <div className="job-card-top">
        <div className="client-logo">{(job.client?.clientProfile?.displayName ?? job.client?.name ?? "A").slice(0, 1).toUpperCase()}</div>
        <button className="bookmark-button" aria-label="Save job" title="Save job" onClick={() => user ? save.mutate() : navigate("/login")} disabled={save.isPending}>
          <BookmarkSimple size={20} weight={save.isSuccess ? "fill" : "regular"} />
        </button>
      </div>
      <Link to={`/jobs/${job.id}`} className="job-card-link">
        <div className="job-meta"><span>{job.category?.name ?? "Freelance"}</span><span className="meta-dot" />{formatDate(job.createdAt)}</div>
        <h3>{job.title}</h3>
        {!compact && <p className="job-card-description">{job.description}</p>}
        <div className="skill-list">{job.skills?.slice(0, compact ? 2 : 4).map(({ skill }) => <span className="skill-tag" key={skill.name}>{skill.name}</span>)}</div>
      </Link>
      <div className="job-card-footer">
        <div className="job-facts">
          <span><Clock size={15} /> {job.budgetType === "fixed" ? "Fixed price" : "Hourly"}</span>
          {typeof job._count?.proposals === "number" && <span><Users size={15} /> {job._count.proposals} proposals</span>}
          {job.client?.clientProfile?.location && <span className="location-fact"><MapPin size={15} /> {job.client.clientProfile.location}</span>}
        </div>
        <strong className="job-budget">{amount ? formatMoney(amount, job.currency) : job.currency}<small>{job.budgetType === "hourly" ? "/hr" : ""}</small></strong>
      </div>
      {save.isError && <span className="inline-error">{save.error.message}</span>}
    </article>
  )
}
