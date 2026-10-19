import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BookmarkSimple, CalendarBlank, Check, Clock, MapPin, ShieldCheck, Users } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button } from "~/components/ui/button"
import { ErrorState, LoadingState } from "~/components/page-state"
import { ReportControl } from "~/components/report-control"
import { api, errorMessage, formatDate, formatMoney, type Job, type Page, type Proposal, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"
import { useSavedJob } from "~/lib/saved-jobs"

export default function JobDetailPage() {
  const { jobId = "" } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [amount, setAmount] = useState("")
  const [duration, setDuration] = useState("")
  const jobQuery = useQuery({ queryKey: ["jobs", jobId], queryFn: () => api.get<Result<Job>>(`/jobs/${jobId}`), enabled: Boolean(jobId) })
  const job = jobQuery.data?.data
  const savedJob = useSavedJob(job)
  const proposals = useQuery({ queryKey: ["proposals", "mine", jobId], queryFn: async () => (await api.get<Page<Proposal>>(`/proposals/mine?limit=100`)).data, enabled: Boolean(user) })
  const hasApplied = Boolean(proposals.data?.some((proposal) => proposal.jobId === jobId))
  const apply = useMutation({
    mutationFn: async () => {
      const minor = job!.currency === "USD" ? Math.round(Number(amount) * 100) : Math.round(Number(amount))
      return api.post<Result<{ id: string }>>(`/jobs/${jobId}/proposals`, { coverMessage: message, amountMinor: minor, currency: job!.currency, estimatedDurationDays: duration ? Number(duration) : undefined })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); navigate("/proposals") },
  })
  if (jobQuery.isLoading) return <LoadingState label={t("Loading")} />
  if (jobQuery.isError) return <div className="page-container"><ErrorState error={jobQuery.error} retry={() => void jobQuery.refetch()} /></div>
  if (!job) return null
  const budget = job.maxAmountMinor ?? job.minAmountMinor
  const min = job.minAmountMinor ? formatMoney(job.minAmountMinor, job.currency) : null
  const max = job.maxAmountMinor ? formatMoney(job.maxAmountMinor, job.currency) : null
  function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) { navigate(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`); return }
    apply.mutate()
  }
  return (
    <div className="page-container detail-container">
      <Link to="/jobs" className="back-link"><ArrowLeft size={16} /> {t("Back to opportunities")}</Link>
      <div className="detail-layout">
        <article className="job-detail-main">
          <div className="detail-topline"><span className="status-pill"><i /> {t("Accepting proposals")}</span><button className={`bookmark-button detail-bookmark${savedJob.isSaved ? " is-saved" : ""}`} aria-pressed={savedJob.isSaved} aria-label={t(savedJob.isSaved ? "Remove saved job" : "Save job")} title={t(savedJob.isSaved ? "Remove saved job" : "Save job")} disabled={savedJob.isPending} onClick={() => user ? savedJob.toggle() : navigate("/login")}><BookmarkSimple size={20} weight={savedJob.isSaved ? "fill" : "regular"} /> {t(savedJob.isSaved ? "Saved" : "Save job")}</button></div>
          <p className="section-kicker">{t(job.category?.name ?? "OPEN ROLE")} <span className="meta-dot" /> POSTED {formatDate(job.createdAt).toUpperCase()}</p>
          <h1>{job.title}</h1>
          <div className="detail-company"><div className="client-logo client-logo-large">{(job.client?.clientProfile?.displayName ?? job.client?.name ?? "A").slice(0, 1).toUpperCase()}</div><div><Link to={`/profiles/${job.client?.id}`}><strong>{job.client?.clientProfile?.displayName ?? job.client?.name ?? "Archer client"}</strong></Link><span>{t("Client on Archer")}</span></div><span className="verified-badge"><ShieldCheck size={16} /> {t("Verified profile")}</span></div>
          <div className="detail-stats"><div><span className="detail-stat-icon"><CurrencySymbol currency={job.currency} /></span><span><small>{t("BUDGET")}</small><strong>{min && max && min !== max ? `${min} – ${max}` : (max ?? min ?? job.currency)}{job.budgetType === "hourly" && <small className="rate-suffix"> / {t("Hourly").toLowerCase()}</small>}</strong></span></div><div><span className="detail-stat-icon"><Clock size={19} /></span><span><small>{t("CONTRACT")}</small><strong>{t(job.budgetType === "fixed" ? "Fixed price" : "Hourly")}</strong></span></div><div><span className="detail-stat-icon"><Users size={19} /></span><span><small>{t("PROPOSALS")}</small><strong>{job._count?.proposals ?? "New"}</strong></span></div></div>
          <section className="detail-section"><h2>{t("About the work")}</h2><p className="detail-description">{job.description}</p></section>
          {job.skills?.length ? <section className="detail-section"><h2>{t("Skills and expertise")}</h2><div className="skill-list">{job.skills.map(({ skill }) => <span className="skill-tag" key={skill.name}>{skill.name}</span>)}</div></section> : null}
          <section className="detail-section detail-expectations"><h2>{t("What to expect")}</h2><p><Check size={16} /> {t("Discuss the scope directly with the client")}</p><p><Check size={16} /> {t("Agree on the project details before getting started")}</p><p><Check size={16} /> {t("This listing does not include payment processing")}</p></section>
          {savedJob.error && <p className="inline-error">{errorMessage(savedJob.error)}</p>}
          {user?.id !== job.client?.id && <ReportControl targetType="job" targetId={job.id} compact />}
        </article>
        <aside className="proposal-panel">
          {user && job.client?.id === user.id ? <div className="proposal-panel-head"><span className="panel-kicker">{t("YOUR JOB")}</span><h2>{t("Review your proposals")}</h2><p>{t("See who’s interested and choose the right fit for this work.")}</p><Link to={`/jobs/${job.id}/proposals`} className="button-primary full-width">{t("View proposals")} <Users size={16} /></Link></div> : <>
          <div className="proposal-panel-head"><span className="panel-kicker">{t("YOUR NEXT MOVE")}</span><h2>{t("Interested in this work?")}</h2><p>{t("Send a thoughtful proposal to start a conversation.")}</p></div>
          {hasApplied ? <div className="already-applied"><Check size={22} /><strong>{t("You’ve sent a proposal")}</strong><span>{t("Track its status from your proposals.")}</span><Link to="/proposals" className="text-link">{t("View proposals")} →</Link></div> : !user?.freelancerProfile ? <div className="profile-required"><p>{t(user ? "Set up your freelancer profile before applying." : "Sign in or create an account to send a proposal.")}</p><Link className="button-primary full-width" to={user ? "/settings/profile" : `/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`}>{t(user ? "Complete your profile" : "Sign in to apply")}</Link></div> : <form className="form-stack proposal-form" onSubmit={submitProposal}>
            <label className="form-field"><span>{t("Your proposal")} <small>{t("Be clear about your approach")}</small></span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t("Tell the client why you’re a good fit…")} required minLength={30} maxLength={5000} rows={5} /></label>
            <label className="form-field"><span>{t("Your quote")} <small>{job.currency} · {t(job.currency === "USD" ? "Enter dollars" : "Enter whole kyat")}</small></span><span className="amount-input"><b>{job.currency}</b><input type="number" min="1" step={job.currency === "USD" ? "0.01" : "1"} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={job.currency === "USD" ? "750.00" : "500000"} required /></span></label>
            {job.budgetType === "fixed" && <label className="form-field"><span>{t("Estimated duration")} <small>{t("Optional")}</small></span><span className="amount-input"><CalendarBlank size={17} /><input type="number" min="1" max="3650" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder={t("Number of days")} /></span></label>}
            {apply.isError && <div className="form-error">{errorMessage(apply.error)}</div>}
            <Button type="submit" size="lg" className="full-width" disabled={apply.isPending || (job.currency === "USD" && Number(amount) <= 0)}>{t(apply.isPending ? "Sending…" : "Send proposal")}</Button>
            <p className="privacy-note">{t("No payment is collected through Archer. Your proposal records the amount you’re quoting.")}</p>
          </form>}
          </>}
        </aside>
      </div>
    </div>
  )
}

function CurrencySymbol({ currency }: { currency: string }) { return <span className="currency-symbol">{currency}</span> }
