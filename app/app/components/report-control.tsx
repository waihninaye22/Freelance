import { useMutation } from "@tanstack/react-query"
import { Flag, PaperPlaneRight } from "@phosphor-icons/react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { api, errorMessage } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

type TargetType = "job" | "profile" | "proposal" | "message"
export function ReportControl({ targetType, targetId, compact = false }: { targetType: TargetType; targetId: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const report = useMutation({ mutationFn: (payload: { reason: string; details: string }) => api.post("/reports", { ...payload, targetType, targetId }), onSuccess: () => { setSent(true); setOpen(false) } })
  if (!user || user.isAdmin || user.id === targetId || sent) return sent ? <span className="report-sent">{t("Report received")}</span> : null
  return <div className="report-control">{!open ? <button type="button" className={compact ? "text-button report-trigger" : "button-outline report-trigger"} onClick={() => setOpen(true)}><Flag size={15} /> {t("Report")}</button> : <form className="report-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); report.mutate({ reason: String(data.get("reason") ?? ""), details: String(data.get("details") ?? "") }) }}>
    <label className="form-field"><span>{t("Reason")}</span><select name="reason" defaultValue="misleading details"><option value="spam">{t("Spam")}</option><option value="inappropriate content">{t("Inappropriate content")}</option><option value="misleading details">{t("Misleading details")}</option><option value="harassment">{t("Harassment")}</option><option value="other">{t("Other")}</option></select></label>
    <label className="form-field"><span>{t("Details")} <small>{t("Optional")}</small></span><textarea name="details" rows={2} maxLength={3000} placeholder={t("Share context to help our team review.")} /></label>
    {report.isError && <p className="form-error">{errorMessage(report.error)}</p>}<div className="report-actions"><button className="text-button" type="button" onClick={() => setOpen(false)}>{t("Cancel")}</button><Button size="sm" type="submit" disabled={report.isPending}>{t("Send report")} <PaperPlaneRight size={14} /></Button></div>
  </form>}</div>
}
