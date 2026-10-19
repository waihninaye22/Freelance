import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Bell, Check } from "@phosphor-icons/react"
import { Link, Navigate } from "react-router"
import { EmptyState, LoadingState, QueryError } from "~/components/page-state"
import { api, errorMessage, formatDate, type Notification, type Page, type Result } from "~/lib/api"
import { useAuth } from "~/lib/auth"

const notificationKey = ["notifications"] as const
const unreadCountKey = ["notifications", "unread-count"] as const

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const notifications = useQuery({
    queryKey: notificationKey,
    queryFn: () => api.get<Page<Notification>>("/notifications?limit=100"),
    enabled: Boolean(user),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
  const refreshNotifications = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKey }),
    queryClient.invalidateQueries({ queryKey: unreadCountKey }),
  ])
  const markRead = useMutation({ mutationFn: (id: string) => api.post(`/notifications/${id}/read`), onSuccess: refreshNotifications })
  const markAll = useMutation({ mutationFn: () => api.post("/notifications/read-all"), onSuccess: refreshNotifications })

  if (authLoading) return <LoadingState label="Loading notifications" />
  if (!user) return <Navigate to="/login?next=%2Fnotifications" replace />

  const unread = notifications.data?.data.filter((item) => !item.readAt).length ?? 0
  const mutationError = markRead.error ?? markAll.error
  return (
    <div className="page-container notifications-page">
      <div className="page-heading-row">
        <div>
          <p className="section-kicker">YOUR UPDATES</p>
          <h1>Notifications.</h1>
          <p>Messages and milestones from your Archer workspace.</p>
        </div>
        <div className="notification-heading-actions">
          {notifications.isFetching && !notifications.isLoading && <span className="notification-sync-state">Updating…</span>}
          {unread > 0 && <button className="button-outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}><Check size={16} /> {markAll.isPending ? "Marking read…" : "Mark all as read"}</button>}
        </div>
      </div>
      {mutationError && <p className="notification-error" role="alert">{errorMessage(mutationError)}</p>}
      {notifications.isLoading ? <LoadingState label="Loading notifications" /> : notifications.isError ? <QueryError error={notifications.error} retry={() => void notifications.refetch()} /> : notifications.data?.data.length ? (
        <div className="notification-list">
          {notifications.data.data.map((item) => {
            const href = notificationHref(item, user)
            return <article className={item.readAt ? "notification-row" : "notification-row unread"} key={item.id}>
              <span className="notification-icon"><Bell size={19} weight="duotone" /></span>
              <Link className="notification-copy" to={href} onClick={() => { if (!item.readAt) markRead.mutate(item.id) }}>
                <p>{item.message}</p>
                <span>{formatDate(item.createdAt)} · {item.type.replaceAll("_", " ")}</span>
              </Link>
              <div className="notification-actions">
                {!item.readAt && <button className="text-button" onClick={() => markRead.mutate(item.id)} disabled={markRead.isPending}>Mark read</button>}
                <Link to={href} onClick={() => { if (!item.readAt) markRead.mutate(item.id) }} aria-label={`Open notification: ${item.message}`}><ArrowRight size={17} /></Link>
              </div>
            </article>
          })}
        </div>
      ) : <EmptyState title="You’re all caught up" description="Project messages and important milestones will show up here." action={<Link to="/projects" className="button-outline">Open projects <ArrowRight size={16} /></Link>} />}
    </div>
  )
}

function notificationHref(item: Notification, user: { clientProfile?: unknown; freelancerProfile?: unknown }) {
  if (item.href?.startsWith("/") && !item.href.startsWith("//")) return item.href
  if (item.type === "proposal_received") return user.clientProfile ? "/my-jobs" : "/proposals"
  if (item.type.startsWith("proposal_")) return "/proposals"
  if (["hired", "project_created", "project_message", "work_submitted", "project_completed", "cancellation_requested", "cancellation_resolved"].includes(item.type)) return "/projects"
  return "/dashboard"
}
