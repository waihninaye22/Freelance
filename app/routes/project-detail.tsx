import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Check, PaperPlaneRight, Star } from "@phosphor-icons/react"
import { useState } from "react"
import { Link, Navigate, useParams } from "react-router"
import { Button } from "~/components/ui/button"
import { EmptyState, LoadingState, QueryError } from "~/components/page-state"
import { ReportControl } from "~/components/report-control"
import { api, errorMessage, formatDate, formatMoney, type Message, type Page, type Project, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"
import { useTranslation } from "~/i18n"

export default function ProjectDetailPage() {
  const { projectId = "" } = useParams()
  const { language, t } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState("5")
  const [review, setReview] = useState("")
  const projectKey = ["project", projectId]
  const messagesKey = ["project-messages", projectId]
  const project = useQuery({ queryKey: projectKey, queryFn: () => api.get<Result<Project & { reviews?: { authorId: string }[] }>>(`/projects/${projectId}`), enabled: Boolean(user && projectId) })
  const messages = useQuery({ queryKey: messagesKey, queryFn: () => api.get<Page<Message>>(`/projects/${projectId}/messages?limit=100`), enabled: Boolean(user && projectId), refetchInterval: 15_000 })
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: projectKey }), queryClient.invalidateQueries({ queryKey: messagesKey }), queryClient.invalidateQueries({ queryKey: ["projects", "mine"] }), queryClient.invalidateQueries({ queryKey: ["notifications"] })])
  const send = useMutation({ mutationFn: (body: string) => api.post(`/projects/${projectId}/messages`, { body }), onSuccess: async () => { setMessage(""); await refresh() } })
  const action = useMutation({ mutationFn: (endpoint: string) => api.post(`/projects/${projectId}/${endpoint}`), onSuccess: refresh })
  const leaveReview = useMutation({ mutationFn: () => api.post(`/projects/${projectId}/reviews`, { rating: Number(rating), body: review }), onSuccess: refresh })
  if (authLoading) return <LoadingState label={t("Opening the project")} />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`} replace />
  if (project.isLoading) return <LoadingState label={t("Loading project details")} />
  if (project.isError) return <div className="page-container"><QueryError error={project.error} retry={() => void project.refetch()} /></div>
  const item = project.data?.data
  if (!item) return <EmptyState title={t("Project not found")} description={t("This project may have been removed or may not be available to your account.")} action={<Link to="/projects" className="button-outline">{t("Back to projects")}</Link>} />
  const isClient = item.clientId === user.id
  const isFreelancer = item.freelancerId === user.id
  const myReview = item.reviews?.some((entry) => entry.authorId === user.id)
  const canMessage = !["completed", "cancelled"].includes(item.status)
  return <div className="page-container project-detail-page">
    <Link to="/projects" className="back-link"><ArrowLeft size={16} /> {t("All projects")}</Link>
    <div className="project-detail-heading"><div><p className="section-kicker">{t("PROJECT WORKSPACE")}</p><h1>{item.job?.title ?? "Archer project"}</h1><p>{t("You’re working with")} {isClient ? (item.freelancer?.name ?? t("your freelancer")) : (item.client?.name ?? t("your client"))}</p></div><span className={`project-status status-${item.status}`}>{t(item.status.replaceAll("_", " "))}</span></div>
    <div className="project-detail-grid"><div className="project-main-column">
      <section className="workspace-panel agreement-panel"><div className="panel-heading"><div><p className="section-kicker">{t("THE AGREEMENT")}</p><h2>{t("Scope & details")}</h2></div></div><p className="scope-copy">{item.scopeSummary}</p><div className="agreement-amount"><span>{t("Agreed amount")}</span><strong>{formatMoney(item.amountMinor, item.currency)}</strong></div><div className="agreement-meta"><span>{t("Created")} {formatDate(item.createdAt ?? item.updatedAt)}</span><span>{t("Updated")} {formatDate(item.updatedAt)}</span></div>
        <div className="project-actions">{isFreelancer && item.status === "active" && <Button onClick={() => action.mutate("submit")} disabled={action.isPending}>{t("Submit work")} <Check size={16} /></Button>}{isClient && item.status === "submitted" && <Button onClick={() => action.mutate("complete")} disabled={action.isPending}>{t("Mark complete")} <Check size={16} /></Button>}{["active", "submitted"].includes(item.status) && <button className="text-button danger-text" onClick={() => action.mutate("cancel")} disabled={action.isPending}>{t("Request cancellation")}</button>}{item.status === "cancellation_requested" && <p className="inline-notice">{t("Cancellation requested. Archer support will review this request.")}</p>}</div>
        {action.isError && <p className="form-error">{errorMessage(action.error)}</p>}
      </section>
      {item.status === "completed" && !myReview && <section className="workspace-panel review-panel"><div><p className="section-kicker">{t("CLOSE THE LOOP")}</p><h2>{t("Leave a review")}</h2><p>{t("Share a helpful note about your experience working together.")}</p></div><form className="review-form" onSubmit={(event) => { event.preventDefault(); leaveReview.mutate() }}><label className="form-field"><span>{t("Rating")}</span><select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {t(value === 1 ? "star" : "stars")}</option>)}</select></label><label className="form-field"><span>{t("Review")} <small>{t("Optional")}</small></span><textarea value={review} onChange={(event) => setReview(event.target.value)} rows={3} maxLength={2000} placeholder={t("What went well?")} /></label><Button type="submit" disabled={leaveReview.isPending}>{t("Post review")} <Star size={16} /></Button>{leaveReview.isError && <p className="form-error">{errorMessage(leaveReview.error)}</p>}</form></section>}
      {myReview && <div className="form-success"><Check size={17} /> {t("You’ve left a review for this project.")}</div>}
      <section className="workspace-panel conversation-panel"><div className="panel-heading"><div><p className="section-kicker">{t("PROJECT CONVERSATION")}</p><h2>{t("Messages")}</h2></div><span className="message-count">{messages.data?.pagination.total ?? 0} {t("total")}</span></div>{messages.isLoading ? <LoadingState label={t("Loading messages")} /> : messages.isError ? <QueryError error={messages.error} retry={() => void messages.refetch()} /> : messages.data?.data.length ? <div className="message-list">{messages.data.data.map((entry) => { const mine = entry.sender?.id === user.id; return <article className={mine ? "message-item mine" : "message-item"} key={entry.id}><div className="message-avatar">{entry.sender?.name?.slice(0, 1).toUpperCase() ?? "A"}</div><div className="message-bubble"><div className="message-meta"><strong>{mine ? t("You") : entry.sender?.name ?? t("Project participant")}</strong><time>{new Intl.DateTimeFormat(language === "my" ? "my-MM" : "en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(entry.createdAt))}</time></div><p>{entry.body}</p>{!mine && <ReportControl targetType="message" targetId={entry.id} compact />}</div></article> })}</div> : <EmptyState title={t("Start the conversation")} description={t("Use this space to align on progress, questions, and next steps.")} />}
        {canMessage ? <form className="message-composer" onSubmit={(event) => { event.preventDefault(); if (message.trim()) send.mutate(message.trim()) }}><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} maxLength={10000} placeholder={t("Write a project update…")} aria-label={t("Write a project message")} /><Button type="submit" disabled={!message.trim() || send.isPending} aria-label={t("Send message")}><PaperPlaneRight size={18} /></Button>{send.isError && <p className="form-error">{errorMessage(send.error)}</p>}</form> : <p className="muted-copy">{t("This project conversation is closed.")}</p>}
      </section>
    </div><aside className="workspace-sidebar"><div className="workspace-panel participant-panel"><p className="section-kicker">{t("PEOPLE")}</p><h2>{t("Your collaborators")}</h2><div className="participant-row"><span className="avatar">{item.client?.name?.slice(0, 1).toUpperCase() ?? "C"}</span><span><strong>{item.client?.name ?? t("Client")}</strong><small>{t("Client")}{isClient ? ` · ${t("You")}` : ""}</small></span></div><div className="participant-row"><span className="avatar avatar-peach">{item.freelancer?.name?.slice(0, 1).toUpperCase() ?? "F"}</span><span><strong>{item.freelancer?.name ?? t("Freelancer")}</strong><small>{t("Freelancer")}{isFreelancer ? ` · ${t("You")}` : ""}</small></span></div></div><div className="currency-note"><span className="currency-note-icon">◎</span><p>{t("This agreement records the agreed amount. Archer doesn’t process or hold payments.")}</p></div><Link to="/notifications" className="text-link sidebar-link">{t("View notifications")} <ArrowRight size={15} /></Link></aside></div>
  </div>
}
