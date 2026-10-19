import { BookmarkSimple, Clock, MapPin, Users } from "@phosphor-icons/react"
import { Link, useNavigate } from "react-router"
import { errorMessage, formatDate, formatMoney, type Job } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"
import { useSavedJob } from "~/lib/saved-jobs"

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const savedJob = useSavedJob(job)
  const amount = job.maxAmountMinor ?? job.minAmountMinor
  return (
    <article className={`job-card ${compact ? "job-card-compact" : ""}`}>
      <div className="job-card-top">
        <div className="client-logo">{(job.client?.clientProfile?.displayName ?? job.client?.name ?? "A").slice(0, 1).toUpperCase()}</div>
        <button className={`bookmark-button${savedJob.isSaved ? " is-saved" : ""}`} aria-label={t(savedJob.isSaved ? "Remove saved job" : "Save job")} title={t(savedJob.isSaved ? "Remove saved job" : "Save job")} aria-pressed={savedJob.isSaved} onClick={() => user ? savedJob.toggle() : navigate("/login")} disabled={savedJob.isPending}>
          <BookmarkSimple size={20} weight={savedJob.isSaved ? "fill" : "regular"} />
        </button>
      </div>
      <Link to={`/jobs/${job.id}`} className="job-card-link">
        <div className="job-meta"><span>{t(job.category?.name ?? "Freelance")}</span><span className="meta-dot" />{formatDate(job.createdAt)}</div>
        <h3>{job.title}</h3>
        {!compact && <p className="job-card-description">{job.description}</p>}
        <div className="skill-list">{job.skills?.slice(0, compact ? 2 : 4).map(({ skill }) => <span className="skill-tag" key={skill.name}>{skill.name}</span>)}</div>
      </Link>
      <div className="job-card-footer">
        <div className="job-facts">
          <span><Clock size={15} /> {t(job.budgetType === "fixed" ? "Fixed price" : "Hourly")}</span>
          {typeof job._count?.proposals === "number" && <span><Users size={15} /> {t("{count} proposals").replace("{count}", String(job._count.proposals))}</span>}
          {job.client?.clientProfile?.location && <span className="location-fact"><MapPin size={15} /> {job.client.clientProfile.location}</span>}
        </div>
        <strong className="job-budget">{amount ? formatMoney(amount, job.currency) : job.currency}<small>{job.budgetType === "hourly" ? "/hr" : ""}</small></strong>
      </div>
      {savedJob.error && <span className="inline-error">{errorMessage(savedJob.error)}</span>}
    </article>
  )
}
