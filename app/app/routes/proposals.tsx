import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Check, ClipboardText, PencilSimple, X } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, Navigate } from "react-router"
import { Button } from "~/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "~/components/page-state"
import { api, errorMessage, formatDate, formatMoney, type Page, type Proposal, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

function ProposalRow({ proposal, onChanged }: { proposal: Proposal; onChanged: () => void }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState(proposal.coverMessage)
  const [amount, setAmount] = useState(proposal.currency === "USD" ? (proposal.amountMinor / 100).toFixed(2) : String(proposal.amountMinor))
  const [duration, setDuration] = useState(proposal.estimatedDurationDays ? String(proposal.estimatedDurationDays) : "")
  const editable = proposal.status === "pending" && proposal.job?.status === "open"
  const save = useMutation({ mutationFn: () => api.patch<Result<Proposal>>(`/proposals/${proposal.id}`, { coverMessage: message.trim(), amountMinor: Math.round(Number(amount) * (proposal.currency === "USD" ? 100 : 1)), estimatedDurationDays: duration ? Number(duration) : null }), onSuccess: () => { setEditing(false); onChanged() } })
  const withdraw = useMutation({ mutationFn: () => api.post(`/proposals/${proposal.id}/withdraw`), onSuccess: onChanged })
  return <article className="freelancer-proposal-card"><div className="proposal-summary"><div className="proposal-job"><span className="proposal-mini-icon"><ClipboardText size={18} /></span><span><Link to={`/jobs/${proposal.jobId}`}>{proposal.job?.title ?? "Job opportunity"}</Link><small>{proposal.job?.client?.name ?? "Archer client"}</small></span></div><strong>{formatMoney(proposal.amountMinor, proposal.currency)}</strong><span className={`project-status status-${proposal.status}`}>{t(proposal.status)}</span><span className="proposal-date">{formatDate(proposal.createdAt)}</span><Link to={`/jobs/${proposal.jobId}`} className="row-arrow-link" aria-label={t("Open opportunity")}><ArrowRight size={17} /></Link></div>
    {editing && <form className="proposal-edit-form" onSubmit={(event) => { event.preventDefault(); save.mutate() }}><label className="form-field"><span>{t("Proposal message")}</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} required minLength={30} maxLength={5000} /></label><div className="form-row"><label className="form-field"><span>{t("Your quote ·")} {proposal.currency}</span><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step={proposal.currency === "USD" ? "0.01" : "1"} required /></label><label className="form-field"><span>{t("Estimated duration")} <small>{t("Optional, days")}</small></span><input value={duration} onChange={(event) => setDuration(event.target.value)} type="number" min="1" max="3650" /></label></div>{save.isError && <p className="form-error">{errorMessage(save.error)}</p>}<div className="proposal-edit-actions"><button className="text-button" type="button" onClick={() => { setEditing(false); setMessage(proposal.coverMessage); setAmount(proposal.currency === "USD" ? (proposal.amountMinor / 100).toFixed(2) : String(proposal.amountMinor)); setDuration(proposal.estimatedDurationDays ? String(proposal.estimatedDurationDays) : "") }}><X size={15} /> {t("Cancel")}</button><Button type="submit" size="sm" disabled={save.isPending || message.trim().length < 30 || Number(amount) <= 0}>{t(save.isPending ? "Saving…" : "Save proposal")}<Check size={15} /></Button></div></form>}
    {!editing && <div className="proposal-message-preview">{proposal.coverMessage}</div>}
    {withdraw.isError && <p className="form-error">{errorMessage(withdraw.error)}</p>}
    {!editing && (editable || ["pending", "shortlisted"].includes(proposal.status)) && <div className="proposal-row-actions">{editable && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><PencilSimple size={15} /> {t("Edit")}</Button>}<button className="text-button danger-text" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>{t("Withdraw proposal")}</button></div>}
  </article>
}

export default function ProposalsPage() {
  const { user, isLoading } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ["proposals", "mine"]
  const proposals = useQuery({ queryKey, queryFn: () => api.get<Page<Proposal>>("/proposals/mine?limit=100"), enabled: Boolean(user?.freelancerProfile) })
  const onChanged = () => { void queryClient.invalidateQueries({ queryKey }); void queryClient.invalidateQueries({ queryKey: ["proposals"] }); void queryClient.invalidateQueries({ queryKey: ["jobs"] }) }
  if (isLoading) return <LoadingState />
  if (!user) return <Navigate to="/login?next=%2Fproposals" replace />
  if (!user.freelancerProfile) return <div className="page-container"><EmptyState title={t("Set up your freelancer profile")} description={t("Your proposals live here once you’ve added a freelancer profile.")} action={<Link to="/settings/profile" className="button-primary">{t("Set up profile")}</Link>} /></div>
  return <div className="page-container"><div className="page-title-row"><div><p className="section-kicker">{t("YOUR APPLICATIONS")}</p><h1>{t("Proposals in")} <em>{t("motion.")}</em></h1><p className="page-lede">{t("Keep track of the conversations you’ve started.")}</p></div></div>{proposals.isLoading ? <LoadingState label={t("Loading proposals")} /> : proposals.isError ? <ErrorState error={proposals.error} retry={() => void proposals.refetch()} /> : proposals.data?.data.length ? <div className="freelancer-proposal-list">{proposals.data.data.map((proposal) => <ProposalRow key={proposal.id} proposal={proposal} onChanged={onChanged} />)}</div> : <EmptyState title={t("Your first proposal is waiting")} description={t("Explore open work and send a thoughtful note to start a conversation.")} action={<Link className="button-primary" to="/jobs">{t("Find your next project")}</Link>} />}</div>
}
