import { useQuery } from "@tanstack/react-query"
import { BookmarkSimple } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { JobCard } from "~/components/job-card"
import { EmptyState, LoadingState } from "~/components/page-state"
import { api, type Job, type Page } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

export default function SavedJobsPage() {
  const { user, isLoading } = useAuth()
  const { t } = useTranslation()
  const saved = useQuery({ queryKey: ["saved-jobs"], queryFn: () => api.get<Page<Job>>("/saved-jobs?limit=100"), enabled: Boolean(user) })
  if (isLoading) return <LoadingState />
  if (!user) return <Navigate to="/login?next=%2Fsaved" replace />
  return <div className="page-container"><div className="page-title-row"><div><p className="section-kicker">{t("KEEP THESE CLOSE")}</p><h1>{t("Saved")} <em>{t("opportunities.")}</em></h1><p className="page-lede">{t("The work you’re considering, all in one place.")}</p></div><span className="saved-count"><BookmarkSimple size={17} /> {saved.data?.pagination.total ?? 0} {t("Saved")}</span></div>{saved.isLoading ? <LoadingState label={t("Loading saved work")} /> : saved.data?.data.length ? <div className="job-list saved-jobs-list">{saved.data.data.map((job) => <JobCard job={job} key={job.id} />)}</div> : <EmptyState title={t("Nothing saved just yet")} description={t("When a project catches your eye, bookmark it and come back when you’re ready.")} action={<Link className="button-primary" to="/jobs">{t("Explore opportunities")}</Link>} />}</div>
}
