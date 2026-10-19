import { Link, NavLink, Outlet } from "react-router"
import { ArrowRight, Bell, Briefcase, CaretDown, Compass, Flag, List, SignOut, UserCircle } from "@phosphor-icons/react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "~/lib/auth"
import { api, type Result } from "~/lib/api"

export function AppShell() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get<Result<{ unreadCount: number }>>("/notifications/unread-count"),
    enabled: Boolean(user),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
  const unreadCount = unread.data?.data.unreadCount ?? 0
  return (
    <div className="app-frame">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Archer home">
            <span className="brand-mark">A</span><span>archer<span className="brand-period">.</span></span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/jobs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Compass size={17} weight="duotone" /> Find work</NavLink>
            <a href="/#how-it-works" className="nav-link">How it works</a>
            {user && <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Briefcase size={17} weight="duotone" /> Workspace</NavLink>}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/notifications" className="icon-button notification-trigger" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}>
                  <Bell size={20} weight="regular" />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </Link>
                <button className="account-trigger" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
                  <span className="avatar avatar-small">{user.name.slice(0, 1).toUpperCase()}</span><span className="account-name">{user.name.split(" ")[0]}</span><CaretDown size={14} />
                </button>
                {menuOpen && <div className="account-menu">
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}><UserCircle size={17} /> Dashboard</Link>
                  <Link to="/saved" onClick={() => setMenuOpen(false)}><List size={17} /> Saved jobs</Link>
                  {user.freelancerProfile && <Link to="/proposals" onClick={() => setMenuOpen(false)}><Briefcase size={17} /> My proposals</Link>}
                  {user.clientProfile && <Link to="/my-jobs" onClick={() => setMenuOpen(false)}><Briefcase size={17} /> My job listings</Link>}
                  {user.isAdmin && <Link to="/admin/moderation" onClick={() => setMenuOpen(false)}><Flag size={17} /> Moderation</Link>}
                  <button onClick={() => { signOut(); setMenuOpen(false) }}><SignOut size={17} /> Sign out</button>
                </div>}
              </>
            ) : (
              <><Link className="header-signin" to="/login">Sign in</Link><Link className="header-cta" to="/register">Get started <ArrowRight size={16} /></Link></>
            )}
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer"><div className="footer-inner"><Link to="/" className="brand footer-brand"><span className="brand-mark">A</span><span>archer<span className="brand-period">.</span></span></Link><span>Good work starts with a good match.</span><span>© 2026 Archer</span></div></footer>
    </div>
  )
}
