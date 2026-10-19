import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Briefcase, CurrencyDollar, Info } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { api, errorMessage, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

type Category = { id: string; name: string }
type CreatedJob = { id: string }

export default function PostJobPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currency, setCurrency] = useState<"USD" | "MMK">("USD")
  const categories = useQuery({ queryKey: ["catalog", "categories"], queryFn: () => api.get<Result<Category[]>>("/catalog/categories") })
  const create = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const created = await api.post<Result<CreatedJob>>("/jobs", data)
      await api.post(`/jobs/${created.data.id}/publish`)
      return created.data
    },
    onSuccess: (job) => { void queryClient.invalidateQueries({ queryKey: ["jobs"] }); navigate(`/jobs/${job.id}`) },
  })
  if (!user) return <div className="page-container"><div className="notice-panel"><h1>{t("Sign in to post a job")}</h1><p>{t("You’ll need a client profile to create a listing.")}</p><Link to="/login?next=%2Fpost-job" className="button-primary">{t("Sign in")} <ArrowRight size={16} /></Link></div></div>
  if (!user.clientProfile) return <div className="page-container"><div className="notice-panel"><span className="notice-icon"><Briefcase size={23} /></span><p className="section-kicker">{t("CLIENT PROFILE NEEDED")}</p><h1>{t("Let’s set up your client profile.")}</h1><p>{t("Add your organization details before you post your first opportunity.")}</p><Link to="/settings/profile" className="button-primary">{t("Set up profile")} <ArrowRight size={16} /></Link></div></div>

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const toMinor = (raw: FormDataEntryValue | null) => raw === null || raw === "" ? null : Math.round(Number(raw) * (currency === "USD" ? 100 : 1))
    create.mutate({
      title: values.title, description: values.description, categoryId: values.categoryId, budgetType: values.budgetType,
      minAmountMinor: toMinor(values.minAmount), maxAmountMinor: toMinor(values.maxAmount), currency,
      experienceLevel: values.experienceLevel || null,
      skills: String(values.skills ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    })
  }
  return (
    <div className="page-container narrow-page">
      <Link to="/jobs" className="back-link"><ArrowLeft size={16} /> {t("Back to work")}</Link>
      <div className="form-page-heading"><p className="section-kicker">{t("LET’S MAKE A MATCH")}</p><h1>{t("Post a new")} <em>{t("opportunity.")}</em></h1><p>{t("Share the details clearly so the right people can picture the work.")}</p></div>
      <form className="editor-card form-stack" onSubmit={submit}>
        <label className="form-field"><span>{t("Project title")}</span><input name="title" placeholder="e.g. Design a new booking experience" required minLength={8} maxLength={140} /></label>
        <div className="form-row"><label className="form-field"><span>{t("Category")}</span><select name="categoryId" required defaultValue=""><option value="" disabled>{t("Select a category")}</option>{categories.data?.data.map((item) => <option key={item.id} value={item.id}>{t(item.name)}</option>)}</select></label><label className="form-field"><span>{t("Budget type")}</span><select name="budgetType" defaultValue="fixed"><option value="fixed">{t("Fixed price")}</option><option value="hourly">{t("Hourly")}</option></select></label></div>
        <label className="form-field"><span>{t("Project description")}</span><textarea name="description" placeholder={t("What are you looking to accomplish? Include the context, deliverables, and what a successful result looks like.")} required minLength={30} maxLength={10000} rows={8} /></label>
        <label className="form-field"><span>{t("Skills")} <small>{t("Separate each skill with a comma")}</small></span><input name="skills" placeholder="React, UI design, user research" /></label>
        <div className="currency-selector"><div><span className="currency-selector-icon"><CurrencyDollar size={18} /></span><span><strong>{t("Set your budget currency")}</strong><small>{t("Your listing uses one currency. Archer won’t convert it.")}</small></span></div><div className="segmented"><button type="button" className={currency === "USD" ? "selected" : ""} onClick={() => setCurrency("USD")}>USD</button><button type="button" className={currency === "MMK" ? "selected" : ""} onClick={() => setCurrency("MMK")}>MMK</button></div></div>
        <div className="form-row"><label className="form-field"><span>{t("Minimum budget")} <small>{currency}</small></span><input name="minAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} placeholder={currency === "USD" ? "500.00" : "500000"} /></label><label className="form-field"><span>{t("Maximum budget")} <small>{currency}</small></span><input name="maxAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} placeholder={currency === "USD" ? "1,200.00" : "1,500,000"} /></label></div>
        <label className="form-field"><span>{t("Experience level")} <small>{t("Optional")}</small></span><select name="experienceLevel" defaultValue=""><option value="">{t("Any experience level")}</option><option value="entry">{t("Entry")}</option><option value="intermediate">{t("Intermediate")}</option><option value="expert">{t("Expert")}</option></select></label>
        <div className="form-info"><Info size={17} /><span>{t("This creates a public listing. Archer records proposals and project agreements but does not process payments.")}</span></div>
        {create.isError && <div className="form-error">{errorMessage(create.error)}</div>}
        <div className="form-actions"><Link className="text-link" to="/jobs">{t("Cancel")}</Link><Button type="submit" size="lg" disabled={create.isPending}>{t(create.isPending ? "Publishing…" : "Publish opportunity")}<ArrowRight size={17} /></Button></div>
      </form>
    </div>
  )
}
