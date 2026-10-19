import { useMutation } from "@tanstack/react-query"
import { Flag, PaperPlaneRight } from "@phosphor-icons/react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { api, errorMessage } from "~/lib/api"
import { useAuth } from "~/lib/auth"

type TargetType = "job" | "profile" | "proposal" | "message"
export function ReportControl({ targetType, targetId, compact = false }: { targetType: TargetType; targetId: string; compact?: boolean }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const report = useMutation({ mutationFn: (payload: { reason: string; details: string }) => api.post("/reports", { ...payload, targetType, targetId }), onSuccess: () => { setSent(true); setOpen(false) } })
  if (!user || user.isAdmin || user.id === targetId || sent) return sent ? <span className="report-sent">Report received</span> : null
  return <div className="report-control">{!open ? <button type="button" className={compact ? "text-button report-trigger" : "button-outline report-trigger"} onClick={() => setOpen(true)}><Flag size={15} /> Report</button> : <form className="report-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); report.mutate({ reason: String(data.get("reason") ?? ""), details: String(data.get("details") ?? "") }) }}>
    <label className="form-field"><span>Reason</span><select name="reason" defaultValue="misleading details"><option value="spam">Spam</option><option value="inappropriate content">Inappropriate content</option><option value="misleading details">Misleading details</option><option value="harassment">Harassment</option><option value="other">Other</option></select></label>
    <label className="form-field"><span>Details <small>Optional</small></span><textarea name="details" rows={2} maxLength={3000} placeholder="Share context to help our team review." /></label>
    {report.isError && <p className="form-error">{errorMessage(report.error)}</p>}<div className="report-actions"><button className="text-button" type="button" onClick={() => setOpen(false)}>Cancel</button><Button size="sm" type="submit" disabled={report.isPending}>Send report <PaperPlaneRight size={14} /></Button></div>
  </form>}</div>
}
