import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FunnelSimple, MagnifyingGlass, Plus, SlidersHorizontal } from "@phosphor-icons/react"
import { Link, useSearchParams } from "react-router"
import { Button } from "~/components/ui/button"
import { JobCard } from "~/components/job-card"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { api, type Job, type Page, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

type Category = { id: string; name: string }

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "")
  const [currency, setCurrency] = useState(searchParams.get("currency") ?? "")
  const [budgetType, setBudgetType] = useState(searchParams.get("budgetType") ?? "")
  const categories = useQuery({ queryKey: ["catalog", "categories"], queryFn: () => api.get<Result<Category[]>>("/catalog/categories") })
  const selectedCategoryId = useMemo(() => categories.data?.data.find((item) => item.name === category)?.id ?? "", [categories.data, category])
  const filters = { q: searchParams.get("q") ?? "", categoryId: selectedCategoryId, currency: searchParams.get("currency") ?? "", budgetType: searchParams.get("budgetType") ?? "", page: searchParams.get("page") ?? "1" }
  const queryString = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value))).toString()
  const jobs = useQuery({ queryKey: ["jobs", "search", filters], queryFn: () => api.get<Page<Job>>(`/jobs${queryString ? `?${queryString}` : ""}`), enabled: !category || Boolean(selectedCategoryId) })

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (q.trim()) next.set("q", q.trim())
    if (category) next.set("category", category)
    if (currency) next.set("currency", currency)
    if (budgetType) next.set("budgetType", budgetType)
    setSearchParams(next)
  }
  function clearFilters() {
    setQ(""); setCategory(""); setCurrency(""); setBudgetType(""); setSearchParams({})
  }

  return (
    <div className="page-container">
      <div className="page-title-row"><div><p className="section-kicker">{t("THE MARKETPLACE")}</p><h1>{t("Find work that")} <em>fits.</em></h1><p className="page-lede">{t("Thoughtful projects from people who value what you do.")}</p></div>{user?.clientProfile && <Link className="button-primary" to="/post-job"><Plus size={17} /> {t("Post a job")}</Link>}</div>
      <div className="jobs-layout">
        <aside className="filter-panel">
          <div className="filter-title"><span><SlidersHorizontal size={17} /> {t("Filters")}</span><button type="button" onClick={clearFilters}>{t("Clear all")}</button></div>
          <form onSubmit={applyFilters}>
            <label className="field-label" htmlFor="job-search">{t("Search")}</label>
            <div className="filter-search"><MagnifyingGlass size={17} /><input id="job-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder={t("Role, skill, keyword")} /></div>
            <label className="field-label" htmlFor="category-filter">{t("Category")}</label>
            <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t("All categories")}</option>{categories.data?.data.map((item) => <option key={item.id} value={item.name}>{t(item.name)}</option>)}</select>
            <label className="field-label" htmlFor="currency-filter">{t("Currency")}</label>
            <select id="currency-filter" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="">{t("Any currency")}</option><option value="USD">USD · US Dollar</option><option value="MMK">MMK · Myanmar Kyat</option></select>
            <label className="field-label" htmlFor="budget-filter">{t("Budget type")}</label>
            <select id="budget-filter" value={budgetType} onChange={(event) => setBudgetType(event.target.value)}><option value="">{t("Any budget")}</option><option value="fixed">{t("Fixed price")}</option><option value="hourly">{t("Hourly")}</option></select>
            <Button type="submit" className="filter-submit"><FunnelSimple size={17} /> {t("Apply filters")}</Button>
          </form>
          <div className="currency-note"><span className="currency-note-icon">◎</span><p>{t("Budgets stay in their listed currency. Archer doesn’t convert between USD and MMK.")}</p></div>
        </aside>
        <section className="results-column" aria-label={t("Job results")}>
          <div className="results-heading"><span><strong>{jobs.data?.pagination.total ?? "—"}</strong> {t("opportunities")}</span><label>{t("Sort by")} <select defaultValue="newest"><option value="newest">{t("Newest first")}</option></select></label></div>
          {jobs.isLoading && <LoadingState label={t("Finding opportunities")} />}
          {jobs.isError && <ErrorState error={jobs.error} retry={() => void jobs.refetch()} />}
          {jobs.data && jobs.data.data.length === 0 && <EmptyState title={t("No work found yet")} description={t("Try broadening your filters, or check back soon for new opportunities.")} action={<Button variant="outline" onClick={clearFilters}>{t("Clear filters")}</Button>} />}
          <div className="job-list">{jobs.data?.data.map((job) => <JobCard job={job} key={job.id} />)}</div>
          {jobs.data && jobs.data.pagination.pages > 1 && <div className="pagination-controls"><button disabled={jobs.data.pagination.page <= 1} onClick={() => { const next = new URLSearchParams(searchParams); next.set("page", String(jobs.data!.pagination.page - 1)); setSearchParams(next) }}>{t("Previous")}</button><span>Page {jobs.data.pagination.page} of {jobs.data.pagination.pages}</span><button disabled={jobs.data.pagination.page >= jobs.data.pagination.pages} onClick={() => { const next = new URLSearchParams(searchParams); next.set("page", String(jobs.data!.pagination.page + 1)); setSearchParams(next) }}>{t("Next")}</button></div>}
        </section>
      </div>
    </div>
  )
}
