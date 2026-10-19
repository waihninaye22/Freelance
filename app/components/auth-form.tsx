import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Check, Eye, EyeSlash, LockKey, Sparkle } from "@phosphor-icons/react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Button } from "~/components/ui/button"
import { api, errorMessage, setToken, type Result, type User } from "~/lib/api"
import { useTranslation } from "~/i18n"

type AuthResponse = { user: User; accessToken: string }
type AuthFormProps = { mode: "login" | "register" }

export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useTranslation()
  const isRegister = mode === "register"
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [roles, setRoles] = useState<string[]>(["freelancer"])
  const auth = useMutation({
    mutationFn: async (values: Record<string, unknown>) => api.post<Result<AuthResponse>>(`/auth/${mode === "login" ? "login" : "register"}`, values),
    onSuccess: ({ data }) => {
      setToken(data.accessToken)
      queryClient.setQueryData(["auth", "me"], data.user)
      navigate(searchParams.get("next") || "/dashboard", { replace: true })
    },
  })
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    auth.mutate(isRegister ? { ...values, roles } : values)
  }
  function toggleRole(role: string) {
    setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])
  }
  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Link to="/" className="brand auth-brand"><span className="brand-mark">A</span><span>archer<span className="brand-period">.</span></span></Link>
        <div className="auth-aside-content"><span className="auth-spark"><Sparkle size={22} weight="duotone" /></span><p className="section-kicker">{t("A BETTER WAY TO WORK TOGETHER")}</p><h2>{t("Bring your best")}<br /><em>{t("work forward.")}</em></h2><p>{t("Find projects that fit your strengths, and people who value the way you work.")}</p><div className="auth-proof"><span><Check size={16} /> {t("Transparent budgets in USD and MMK")}</span><span><Check size={16} /> {t("A thoughtful, growing community")}</span><span><Check size={16} /> {t("Your profile, your terms")}</span></div></div>
        <div className="auth-aside-foot">{t("Independent work, made more human.")}</div>
      </div>
      <section className="auth-main">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> {t("Back to Archer")}</Link>
        <div className="auth-card">
          <div className="auth-card-heading"><p className="section-kicker">{t(isRegister ? "YOUR NEXT CHAPTER" : "WELCOME BACK")}</p><h1>{t(isRegister ? "Create your account" : "Sign in to Archer")}</h1><p>{t(isRegister ? "Start finding the people and projects that fit." : "Pick up where you left off.")}</p></div>
          <form onSubmit={submit} className="form-stack">
            {isRegister && <label className="form-field"><span>{t("Your name")}</span><input name="name" type="text" autoComplete="name" placeholder="e.g. Nandar Hlaing" required minLength={2} /></label>}
            <label className="form-field"><span>{t("Email address")}</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label className="form-field"><span>{t("Password")}</span><span className="password-input"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={t(isRegister ? "At least 10 characters" : "Your password")} required minLength={isRegister ? 10 : 1} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={t(showPassword ? "Hide password" : "Show password")}>{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button></span></label>
            {isRegister && <fieldset className="role-picker"><legend>{t("How will you use Archer?")}</legend><label className={roles.includes("freelancer") ? "role-option selected" : "role-option"}><input type="checkbox" checked={roles.includes("freelancer")} onChange={() => toggleRole("freelancer")} /><span className="role-check"><Check size={13} /></span><span><strong>{t("Find freelance work")}</strong><small>{t("Showcase your skills and send proposals")}</small></span></label><label className={roles.includes("client") ? "role-option selected" : "role-option"}><input type="checkbox" checked={roles.includes("client")} onChange={() => toggleRole("client")} /><span className="role-check"><Check size={13} /></span><span><strong>{t("Hire independent talent")}</strong><small>{t("Post a job and find the right fit")}</small></span></label></fieldset>}
            {auth.isError && <div className="form-error"><LockKey size={17} /> {errorMessage(auth.error)}</div>}
            <Button type="submit" size="lg" className="auth-submit" disabled={auth.isPending || (isRegister && roles.length === 0)}>{t(auth.isPending ? "Please wait…" : isRegister ? "Create account" : "Sign in")}<ArrowRight size={17} /></Button>
          </form>
          <p className="auth-switch">{t(isRegister ? "Already have an account?" : "New to Archer?")} <Link to={isRegister ? "/login" : "/register"}>{t(isRegister ? "Sign in" : "Create an account")}</Link></p>
          <p className="terms-note">{t("By continuing, you agree to use Archer with care and respect for the people you work with.")}</p>
        </div>
      </section>
    </div>
  )
}
