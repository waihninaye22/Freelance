import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowUpRight, Flag, ShieldCheck } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, Navigate } from "react-router"
import { Button } from "~/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { api, errorMessage, formatDate, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"

type Report = { id: string; targetType: "job" | "profile" | "proposal" | "message"; targetId: string; reason: string; details?: string | null; status: string; resolution?: string | null; createdAt: string; reporter: { id: string; name: string; email: string } }
const reportStatuses = ["pending", "reviewed", "actioned", "dismissed"] as const

function ReportCard({ report, onResolve, pending }: { report: Report; onResolve: (id: string, status: "reviewed" | "actioned" | "dismissed", resolution: string) => void; pending: boolean }) {
  const [resolution, setResolution] = useState(report.resolution ?? "")
  const targetPath = report.targetType === "job" ? `/jobs/${report.targetId}` : report.targetType === "profile" ? `/profiles/${report.targetId}` : null
  return <article className="moderation-card"><div className="moderation-card-top"><div><span className="moderation-type"><Flag size={14} /> {report.targetType} report</span><h2>{report.reason}</h2></div><span className={`project-status status-${report.status}`}>{report.status}</span></div><p className="moderation-detail">{report.details || "No additional context was provided."}</p><div className="moderation-meta"><span>Reported by <strong>{report.reporter.name}</strong> · {report.reporter.email}</span><time>{formatDate(report.createdAt)}</time></div><div className="moderation-target"><span>Target ID <code>{report.targetId}</code></span>{targetPath && <Link to={targetPath} target="_blank">Open target <ArrowUpRight size={15} /></Link>}</div>{report.status === "pending" ? <><label className="form-field moderation-resolution"><span>Resolution note <small>Required</small></span><textarea value={resolution} onChange={(event) => setResolution(event.target.value)} rows={2} minLength={3} maxLength={1000} placeholder="Record the review outcome and any moderation action." /></label><div className="moderation-actions"><Button variant="outline" onClick={() => onResolve(report.id, "reviewed", resolution)} disabled={pending || resolution.trim().length < 3}>Mark reviewed</Button><Button variant="outline" onClick={() => onResolve(report.id, "dismissed", resolution)} disabled={pending || resolution.trim().length < 3}>Dismiss report</Button><Button onClick={() => onResolve(report.id, "actioned", resolution)} disabled={pending || resolution.trim().length < 3}>Take action <ShieldCheck size={16} /></Button></div>{report.targetType === "job" && <p className="moderation-hint">Taking action on a job report closes that listing. Taking action on a profile report suspends that account.</p>}</> : report.resolution && <p className="moderation-resolution-copy"><strong>Resolution:</strong> {report.resolution}</p>}</article>
}

export default function AdminModerationPage() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<(typeof reportStatuses)[number]>("pending")
  const key = ["admin", "reports", status]
  const reports = useQuery({ queryKey: key, queryFn: () => api.get<Result<Report[]>>(`/reports/admin?status=${status}&limit=100`), enabled: Boolean(user?.isAdmin) })
  const resolve = useMutation({ mutationFn: ({ reportId, nextStatus, resolution }: { reportId: string; nextStatus: "reviewed" | "actioned" | "dismissed"; resolution: string }) => api.patch(`/reports/admin/${reportId}`, { status: nextStatus, resolution }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }); await queryClient.invalidateQueries({ queryKey: ["jobs"] }); await queryClient.invalidateQueries({ queryKey: ["profiles"] }) } })
  if (authLoading) return <LoadingState label="Opening moderation tools" />
  if (!user) return <Navigate to="/login?next=%2Fadmin%2Fmoderation" replace />
  if (!user.isAdmin) return <div className="page-container"><EmptyState title="Administrator access required" description="Moderation tools are only available to Archer administrators." action={<Link to="/dashboard" className="button-outline">Back to workspace</Link>} /></div>
  return <div className="page-container moderation-page"><div className="page-heading-row"><div><p className="section-kicker">ADMIN WORKSPACE</p><h1>Review with <em>care.</em></h1><p>Assess reports, record decisions, and keep an audit trail.</p></div><span className="admin-shield"><ShieldCheck size={24} /> Moderator access</span></div><div className="moderation-filters" role="tablist" aria-label="Filter reports">{reportStatuses.map((item) => <button key={item} role="tab" aria-selected={status === item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}</div>
    {reports.isLoading ? <LoadingState label="Loading reports" /> : reports.isError ? <ErrorState error={reports.error} retry={() => void reports.refetch()} /> : reports.data?.data.length ? <div className="moderation-list">{reports.data.data.map((report) => <ReportCard key={report.id} report={report} pending={resolve.isPending} onResolve={(reportId, nextStatus, resolution) => resolve.mutate({ reportId, nextStatus, resolution })} />)}</div> : <EmptyState title={`No ${status} reports`} description="Reports matching this status will appear here." />}
    {resolve.isError && <div className="form-error">{errorMessage(resolve.error)}</div>}
  </div>
}
