import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Briefcase, CurrencyDollar, Info } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { api, errorMessage, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"

type Category = { id: string; name: string }
type CreatedJob = { id: string }

export default function PostJobPage() {
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
  if (!user) return <div className="page-container"><div className="notice-panel"><h1>Sign in to post a job</h1><p>You’ll need a client profile to create a listing.</p><Link to="/login?next=%2Fpost-job" className="button-primary">Sign in <ArrowRight size={16} /></Link></div></div>
  if (!user.clientProfile) return <div className="page-container"><div className="notice-panel"><span className="notice-icon"><Briefcase size={23} /></span><p className="section-kicker">CLIENT PROFILE NEEDED</p><h1>Let’s set up your client profile.</h1><p>Add your organization details before you post your first opportunity.</p><Link to="/settings/profile" className="button-primary">Set up profile <ArrowRight size={16} /></Link></div></div>

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
      <Link to="/jobs" className="back-link"><ArrowLeft size={16} /> Back to work</Link>
      <div className="form-page-heading"><p className="section-kicker">LET’S MAKE A MATCH</p><h1>Post a new <em>opportunity.</em></h1><p>Share the details clearly so the right people can picture the work.</p></div>
      <form className="editor-card form-stack" onSubmit={submit}>
        <label className="form-field"><span>Project title</span><input name="title" placeholder="e.g. Design a new booking experience" required minLength={8} maxLength={140} /></label>
        <div className="form-row"><label className="form-field"><span>Category</span><select name="categoryId" required defaultValue=""><option value="" disabled>Select a category</option>{categories.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="form-field"><span>Budget type</span><select name="budgetType" defaultValue="fixed"><option value="fixed">Fixed price</option><option value="hourly">Hourly</option></select></label></div>
        <label className="form-field"><span>Project description</span><textarea name="description" placeholder="What are you looking to accomplish? Include the context, deliverables, and what a successful result looks like." required minLength={30} maxLength={10000} rows={8} /></label>
        <label className="form-field"><span>Skills <small>Separate each skill with a comma</small></span><input name="skills" placeholder="React, UI design, user research" /></label>
        <div className="currency-selector"><div><span className="currency-selector-icon"><CurrencyDollar size={18} /></span><span><strong>Set your budget currency</strong><small>Your listing uses one currency. Archer won’t convert it.</small></span></div><div className="segmented"><button type="button" className={currency === "USD" ? "selected" : ""} onClick={() => setCurrency("USD")}>USD</button><button type="button" className={currency === "MMK" ? "selected" : ""} onClick={() => setCurrency("MMK")}>MMK</button></div></div>
        <div className="form-row"><label className="form-field"><span>Minimum budget <small>{currency === "USD" ? "USD" : "MMK"}</small></span><input name="minAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} placeholder={currency === "USD" ? "500.00" : "500000"} /></label><label className="form-field"><span>Maximum budget <small>{currency === "USD" ? "USD" : "MMK"}</small></span><input name="maxAmount" type="number" min="1" step={currency === "USD" ? "0.01" : "1"} placeholder={currency === "USD" ? "1,200.00" : "1,500,000"} /></label></div>
        <label className="form-field"><span>Experience level <small>Optional</small></span><select name="experienceLevel" defaultValue=""><option value="">Any experience level</option><option value="entry">Entry</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option></select></label>
        <div className="form-info"><Info size={17} /><span>This creates a public listing. Archer records proposals and project agreements but does not process payments.</span></div>
        {create.isError && <div className="form-error">{errorMessage(create.error)}</div>}
        <div className="form-actions"><Link className="text-link" to="/jobs">Cancel</Link><Button type="submit" size="lg" disabled={create.isPending}>{create.isPending ? "Publishing…" : "Publish opportunity"}<ArrowRight size={17} /></Button></div>
      </form>
    </div>
  )
}
