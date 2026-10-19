import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowUpRight, Briefcase, MapPin, Star } from "@phosphor-icons/react"
import { Link, useParams } from "react-router"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { ReportControl } from "~/components/report-control"
import { api, formatMoney, type Currency, type Result } from "~/lib/api"

type PublicProfile = {
  id: string; name: string; createdAt: string
  freelancerProfile?: { headline?: string | null; bio?: string | null; location?: string | null; hourlyRateMinor?: number | null; rateCurrency?: Currency | null; skills: { skill: { name: string } }[]; portfolioLinks: { id: string; label: string; url: string }[] } | null
  clientProfile?: { displayName: string; description?: string | null; location?: string | null } | null
  _count: { freelancerProjects: number; reviewsReceived: number }
}

export default function PublicProfilePage() {
  const { userId = "" } = useParams()
  const profile = useQuery({ queryKey: ["profiles", userId], queryFn: () => api.get<Result<PublicProfile>>(`/profiles/${userId}`), enabled: Boolean(userId) })
  if (profile.isLoading) return <LoadingState label="Loading profile" />
  if (profile.isError) return <div className="page-container"><ErrorState error={profile.error} retry={() => void profile.refetch()} /></div>
  const person = profile.data?.data
  if (!person) return <div className="page-container"><EmptyState title="Profile not found" description="This profile may be unavailable or no longer active." action={<Link to="/jobs" className="button-outline">Browse opportunities</Link>} /></div>
  const freelancer = person.freelancerProfile
  const client = person.clientProfile
  return <div className="page-container profile-page"><Link to="/jobs" className="back-link"><ArrowLeft size={16} /> Back to Archer</Link><section className="public-profile-card"><div className="public-profile-top"><div className="avatar avatar-xl">{person.name.slice(0, 1).toUpperCase()}</div><div className="public-profile-name"><p className="section-kicker">ARCHER MEMBER</p><h1>{person.name}</h1><p>{freelancer?.headline ?? (client ? client.displayName : "Archer community member")}</p>{(freelancer?.location || client?.location) && <span><MapPin size={15} /> {freelancer?.location ?? client?.location}</span>}</div><ReportControl targetType="profile" targetId={person.id} /></div>
      <div className="profile-stat-row"><div><strong>{person._count.freelancerProjects}</strong><span>Completed projects</span></div><div><strong>{person._count.reviewsReceived}</strong><span>Reviews received</span></div><div><strong>{new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(person.createdAt))}</strong><span>Member since</span></div>{freelancer?.hourlyRateMinor != null && freelancer.rateCurrency && <div><strong>{formatMoney(freelancer.hourlyRateMinor, freelancer.rateCurrency)}<small> / hour</small></strong><span>Starting rate</span></div>}</div>
      {freelancer && <div className="public-profile-sections"><section className="public-profile-section"><p className="section-kicker">ABOUT</p><h2>How I work</h2><p>{freelancer.bio || "This freelancer is still building their profile."}</p></section><section className="public-profile-section"><p className="section-kicker">EXPERTISE</p><h2>Skills</h2>{freelancer.skills.length ? <div className="skill-list">{freelancer.skills.map(({ skill }) => <span className="skill-tag" key={skill.name}>{skill.name}</span>)}</div> : <p>No skills listed yet.</p>}</section>{freelancer.portfolioLinks.length > 0 && <section className="public-profile-section"><p className="section-kicker">SELECTED WORK</p><h2>Portfolio</h2><div className="portfolio-link-list">{freelancer.portfolioLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={16} /></a>)}</div></section>}</div>}
      {client && <section className="public-profile-section client-public-section"><p className="section-kicker">CLIENT</p><h2>{client.displayName}</h2><p>{client.description || "This client is part of the Archer community."}</p>{client.location && <span className="client-location"><MapPin size={15} />{client.location}</span>}</section>}
      {!freelancer && !client && <div className="profile-empty-note"><Briefcase size={18} /> This account has not set up a public marketplace profile.</div>}
    </section></div>
}
