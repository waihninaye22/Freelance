import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react"
import { useState } from "react"
import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import { api, errorMessage } from "~/lib/api"
import { useAuth } from "~/lib/auth"

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [enableFreelancer, setEnableFreelancer] = useState(Boolean(user?.freelancerProfile))
  const [enableClient, setEnableClient] = useState(Boolean(user?.clientProfile))
  const [rateCurrency, setRateCurrency] = useState(user?.freelancerProfile?.rateCurrency ?? "USD")
  const update = useMutation({ mutationFn: (payload: unknown) => api.patch("/profiles/me", payload), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }); setSaved(true); window.setTimeout(() => setSaved(false), 3000) } })
  if (!user) return <div className="page-container"><div className="notice-panel"><h1>Sign in to edit your profile</h1><Link to="/login" className="button-primary">Sign in <ArrowRight size={16} /></Link></div></div>
  const currentUser = user
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = { name: String(form.get("name")) }
    if (enableFreelancer) {
      const rate = String(form.get("hourlyRate") ?? "")
      const currency = String(form.get("rateCurrency") ?? "USD") as "USD" | "MMK"
      payload.freelancer = {
        headline: String(form.get("headline") ?? ""), bio: String(form.get("bio") ?? ""), location: String(form.get("location") ?? ""), timeZone: "Asia/Yangon",
        hourlyRateMinor: rate ? Math.round(Number(rate) * (currency === "USD" ? 100 : 1)) : null,
        rateCurrency: rate ? currency : null,
        skills: String(form.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean),
      }
    }
    if (enableClient) payload.client = { displayName: String(form.get("displayName") ?? currentUser.name), description: String(form.get("clientDescription") ?? ""), location: String(form.get("clientLocation") ?? "") }
    update.mutate(payload)
  }
  return (
    <div className="page-container narrow-page">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to workspace</Link>
      <div className="form-page-heading"><p className="section-kicker">YOUR ARCHER PROFILE</p><h1>Tell your <em>story.</em></h1><p>Give the community a clear picture of who you are and what you do.</p></div>
      <form className="editor-card form-stack" onSubmit={submit}>
        <label className="form-field"><span>Your name</span><input name="name" defaultValue={user.name} required minLength={2} maxLength={80} /></label>
        <div className="role-toggle-grid"><button type="button" className={enableFreelancer ? "role-toggle active" : "role-toggle"} onClick={() => setEnableFreelancer((value) => !value)}><span className="role-check"><Check size={13} /></span><span><strong>Freelancer</strong><small>Show my skills and portfolio</small></span></button><button type="button" className={enableClient ? "role-toggle active" : "role-toggle"} onClick={() => setEnableClient((value) => !value)}><span className="role-check"><Check size={13} /></span><span><strong>Client</strong><small>Post work and hire talent</small></span></button></div>
        {enableFreelancer && <section className="profile-section"><h2>Freelancer profile</h2><label className="form-field"><span>Professional headline</span><input name="headline" defaultValue={user.freelancerProfile?.headline ?? ""} placeholder="e.g. Product designer focused on useful, clear experiences" maxLength={120} /></label><label className="form-field"><span>About your work</span><textarea name="bio" defaultValue={user.freelancerProfile?.bio ?? ""} placeholder="What do you do well? What do you care about?" rows={5} maxLength={4000} /></label><label className="form-field"><span>Skills <small>Separate with commas</small></span><input name="skills" defaultValue={user.freelancerProfile?.skills?.map(({ skill }) => skill.name).join(", ") ?? ""} placeholder="React, Figma, research" /></label><div className="form-row"><label className="form-field"><span>Location</span><input name="location" defaultValue="Yangon, Myanmar" /></label><label className="form-field"><span>Hourly rate <small>Optional</small></span><span className="amount-input"><input name="hourlyRate" type="number" min="0" step={rateCurrency === "USD" ? "0.01" : "1"} defaultValue={user.freelancerProfile?.hourlyRateMinor ? (user.freelancerProfile.rateCurrency === "USD" ? user.freelancerProfile.hourlyRateMinor / 100 : user.freelancerProfile.hourlyRateMinor) : ""} placeholder={rateCurrency === "USD" ? "50" : "50000"} /><select name="rateCurrency" value={rateCurrency} onChange={(event) => setRateCurrency(event.target.value as "USD" | "MMK")}><option value="USD">USD</option><option value="MMK">MMK</option></select></span></label></div></section>}
        {enableClient && <section className="profile-section"><h2>Client profile</h2><label className="form-field"><span>Display name</span><input name="displayName" defaultValue={user.clientProfile?.displayName ?? ""} placeholder="Studio, team, or your name" /></label><label className="form-field"><span>About your organization</span><textarea name="clientDescription" defaultValue={user.clientProfile?.description ?? ""} rows={4} maxLength={2000} /></label><label className="form-field"><span>Location</span><input name="clientLocation" defaultValue={user.clientProfile?.location ?? ""} placeholder="City or Remote" /></label></section>}
        {update.isError && <div className="form-error">{errorMessage(update.error)}</div>}{saved && <div className="form-success"><Check size={17} /> Profile saved</div>}
        <div className="form-actions"><Link className="text-link" to="/dashboard">Cancel</Link><Button type="submit" size="lg" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save profile"}<ArrowRight size={17} /></Button></div>
      </form>
    </div>
  )
}
