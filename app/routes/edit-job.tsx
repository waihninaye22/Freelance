import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { Button } from "~/components/ui/button"
import { ErrorState, LoadingState } from "~/components/page-state"
import { api, errorMessage, type Job, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

type Category = { id: string; name: string }
export default function EditJobPage() {
  const { jobId = "" } = useParams()
  const { t } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currency, setCurrency] = useState<"USD" | "MMK">("USD")
  const jobKey = ["jobs", jobId]
  const job = useQuery({ queryKey: jobKey, queryFn: () => api.get<Result<Job>>(`/jobs/${jobId}`), enabled: Boolean(user && jobId) })
  const categories = useQuery({ queryKey: ["catalog", "categories"], queryFn: () => api.get<Result<Category[]>>("/catalog/categories") })
  useEffect(() => { if (job.data?.data.currency) setCurrency(job.data.data.currency) }, [job.data?.data.currency])
  const save = useMutation({ mutationFn: (payload: Record<string, unknown>) => api.patch<Result<Job>>(`/jobs/${jobId}`, payload), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: jobKey }), queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] }), queryClient.invalidateQueries({ queryKey: ["jobs"] })]); navigate("/my-jobs") } })
  if (authLoading || job.isLoading) return <LoadingState label={t("Loading listing details")} />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/jobs/${jobId}/edit`)}`} replace />
  if (job.isError) return <div className="page-container"><ErrorState error={job.error} retry={() => void job.refetch()} /></div>
  const item = job.data?.data
  if (!item || item.client?.id !== user.id) return <div className="page-container"><ErrorState error={new Error(t("This listing is not available to your account."))} /></div>
  if (!["draft", "open", "paused"].includes(item.status)) return <div className="page-container"><div className="notice-panel"><h1>{t("This listing can no longer be edited")}</h1><p>{t("Closed listings remain available as a record of the work.")}</p><Link to="/my-jobs" className="button-outline">{t("Back to your listings")}</Link></div></div>
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const toMinor = (raw: FormDataEntryValue | null) => raw === null || raw === "" ? null : Math.round(Number(raw) * (currency === "USD" ? 100 : 1))
    save.mutate({ title: form.get("title"), description: form.get("description"), categoryId: form.get("categoryId"), budgetType: form.get("budgetType"), minAmountMinor: toMinor(form.get("minAmount")), maxAmountMinor: toMinor(form.get("maxAmount")), currency, experienceLevel: form.get("experienceLevel") || null, skills: String(form.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean) })
  }
  const displayAmount = (minor: number | null | undefined) => minor == null ? "" : currency === "USD" ? (minor / 100).toFixed(2) : String(minor)
  return <div className="page-container narrow-page"><Link to="/my-jobs" className="back-link"><ArrowLeft size={16} /> {t("Your listings")}</Link><div className="form-page-heading"><p className="section-kicker">{t("CLIENT WORKSPACE")}</p><h1>{t("Refine your")} <em>{t("brief.")}</em></h1><p>{t("Keep the scope and budget clear for interested freelancers.")}</p></div><form className="editor-card form-stack" onSubmit={submit}>
    <label className="form-field"><span>{t("Project title")}</span><input name="title" defaultValue={item.title} required minLength={8} maxLength={140} /></label>
    <div className="form-row"><label className="form-field"><span>{t("Category")}</span><select name="categoryId" defaultValue={item.category?.id} required>{categories.data?.data.map((category) => <option key={category.id} value={category.id}>{t(category.name)}</option>)}</select></label><label className="form-field"><span>{t("Budget type")}</span><select name="budgetType" defaultValue={item.budgetType}><option value="fixed">{t("Fixed price")}</option><option value="hourly">{t("Hourly")}</option></select></label></div>
    <label className="form-field"><span>{t("Project description")}</span><textarea name="description" defaultValue={item.description} required minLength={30} maxLength={10000} rows={8} /></label>
    <label className="form-field"><span>{t("Skills")} <small>{t("Separate with commas")}</small></span><input name="skills" defaultValue={item.skills?.map(({ skill }) => skill.name).join(", ") ?? ""} /></label>
    <div className="currency-selector"><div><strong>{t("Budget currency")}</strong><small>{t("Changing currencies keeps amounts in the entered unit; no conversion is applied.")}</small></div><div className="segmented"><button type="button" className={currency === "USD" ? "selected" : ""} onClick={() => setCurrency("USD")}>USD</button><button type="button" className={currency === "MMK" ? "selected" : ""} onClick={() => setCurrency("MMK")}>MMK</button></div></div>
    <div className="form-row"><label className="form-field"><span>{t("Minimum budget ·")} {currency}</span><input name="minAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} defaultValue={displayAmount(item.minAmountMinor)} /></label><label className="form-field"><span>{t("Maximum budget ·")} {currency}</span><input name="maxAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} defaultValue={displayAmount(item.maxAmountMinor)} /></label></div>
    <label className="form-field"><span>{t("Experience level")}</span><select name="experienceLevel" defaultValue={item.experienceLevel ?? ""}><option value="">{t("Any experience level")}</option><option value="entry">{t("Entry")}</option><option value="intermediate">{t("Intermediate")}</option><option value="expert">{t("Expert")}</option></select></label>
    {save.isError && <div className="form-error">{errorMessage(save.error)}</div>}<div className="form-actions"><Link className="text-link" to="/my-jobs">{t("Cancel")}</Link><Button type="submit" size="lg" disabled={save.isPending}>{t(save.isPending ? "Saving…" : "Save changes")}<ArrowRight size={17} /></Button></div>
  </form></div>
}
