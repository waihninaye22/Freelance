import { useQuery } from "@tanstack/react-query"
import { ArrowRight, ArrowUpRight, Check, Code, Compass, Palette, PenNib, Sparkle } from "@phosphor-icons/react"
import { Form, Link, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { JobCard } from "~/components/job-card"
import { api, type Job, type Page } from "~/lib/api"
import { LoadingState } from "~/components/page-state"
import { useTranslation } from "~/i18n"

const categories = [
  { title: "Development", detail: "Web, mobile & software", icon: Code, color: "sage" },
  { title: "Design", detail: "Brand, product & visual", icon: Palette, color: "peach" },
  { title: "Writing", detail: "Content, copy & more", icon: PenNib, color: "lavender" },
  { title: "Marketing", detail: "Growth & social media", icon: Sparkle, color: "butter" },
]

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const featured = useQuery({ queryKey: ["jobs", "featured"], queryFn: () => api.get<Page<Job>>("/jobs?limit=3") })
  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const query = String(data.get("q") ?? "").trim()
    navigate(query ? `/jobs?q=${encodeURIComponent(query)}` : "/jobs")
  }
  return (
    <>
      <section className="hero-wrap">
        <div className="hero container-wide">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> {t("YOUR NEXT CHAPTER STARTS HERE")}</div>
            <h1>{t("Good work finds")}<br /><em>{t("good people.")}</em></h1>
            <p className="hero-intro">{t("Archer brings ambitious clients and independent talent together. Find meaningful work, or find the person who can make it happen.")}</p>
            <form className="hero-search" onSubmit={search}>
              <span className="search-icon"><Compass size={21} weight="duotone" /></span>
              <input name="q" placeholder={t("Try “brand design” or “React developer”")} aria-label={t("Search jobs and skills")} />
              <Button type="submit" size="lg">{t("Explore work")} <ArrowRight size={17} /></Button>
            </form>
            <div className="hero-trust"><span className="avatar-stack"><i>A</i><i>M</i><i>K</i><i>+</i></span><span>{t("Built for people who care about their craft")}</span></div>
          </div>
          <div className="hero-art" aria-label="Archer marketplace snapshot">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-stamp"><span>MADE FOR</span><strong>good<br />work</strong><span className="stamp-arrow">↗</span></div>
            <div className="floating-card work-card"><div className="mini-card-top"><span className="mini-icon"><Palette size={18} /></span><span className="live-dot">OPEN</span></div><small>DESIGN · FIXED PRICE</small><strong>Refresh our brand identity</strong><div className="mini-card-foot"><span>USD 800 – 1,200</span><span className="mini-arrow"><ArrowUpRight size={16} /></span></div></div>
            <div className="floating-card talent-card"><span className="avatar avatar-large">N</span><div><strong>Nandar H.</strong><span>Product designer</span><div className="rating">★★★★★ <small>Top talent</small></div></div></div>
            <div className="art-caption"><span>01</span><span>Ideas meet expertise</span><i /></div>
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="container-wide trust-inner"><span><Check size={16} /> {t("No payment integration required")}</span><span><Check size={16} /> {t("Your work, your terms")}</span><span><Check size={16} /> {t("USD and MMK budgets")}</span><span><Check size={16} /> {t("A community built on trust")}</span></div></section>

      <section className="section container-wide" id="how-it-works">
        <div className="section-heading"><div><p className="section-kicker">{t("START WITH WHAT YOU NEED")}</p><h2>{t("Make room for")} <em>{t("great work.")}</em></h2></div><Link className="text-link" to="/jobs">{t("Browse all work")} <ArrowRight size={16} /></Link></div>
        <div className="category-grid">{categories.map(({ title, detail, icon: Icon, color }) => <Link className="category-card" to={`/jobs?category=${encodeURIComponent(title)}`} key={title}><span className={`category-icon ${color}`}><Icon size={22} weight="duotone" /></span><strong>{title}</strong><span>{t(detail)}</span><ArrowUpRight className="category-arrow" size={18} /></Link>)}</div>
      </section>

      <section className="section featured-section"><div className="container-wide">
        <div className="section-heading"><div><p className="section-kicker">{t("FRESH OPPORTUNITIES")}</p><h2>{t("Work worth")} <em>{t("doing.")}</em></h2></div><Link className="text-link" to="/jobs">{t("See all opportunities")} <ArrowRight size={16} /></Link></div>
        {featured.isLoading ? <LoadingState label={t("Finding fresh opportunities")} /> : featured.isError ? <p className="muted-copy">{t("We couldn’t reach the marketplace right now. Try again in a moment.")}</p> : <div className="featured-grid">{featured.data?.data.slice(0, 3).map((job) => <JobCard compact key={job.id} job={job} />)}</div>}
      </div></section>

      <section className="cta-section container-wide"><div className="cta-panel"><div className="cta-decoration">A<span>.</span></div><div><p className="section-kicker">{t("GOOD THINGS START WITH A CONVERSATION")}</p><h2>{t("Ready to find your")} <em>{t("next match?")}</em></h2><p>{t("Bring your skills, bring your brief. There’s room for both sides on Archer.")}</p></div><div className="cta-actions"><Link className="button-primary" to="/register">{t("Join Archer")} <ArrowRight size={17} /></Link><Link to="/jobs" className="cta-secondary">{t("Explore jobs")} <ArrowUpRight size={16} /></Link></div></div></section>
    </>
  )
}
