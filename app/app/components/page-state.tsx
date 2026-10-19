import { ArrowClockwise, MagnifyingGlass } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Button } from "~/components/ui/button"
import { errorMessage } from "~/lib/api"
import { useTranslation } from "~/i18n"

export function LoadingState({ label = "Loading" }: { label?: string }) {
  const { t } = useTranslation()
  return <div className="page-state"><span className="spinner" /><p>{t(label)}…</p></div>
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation()
  return <div className="page-state"><div className="state-icon state-error"><ArrowClockwise size={22} /></div><h2>{t("We couldn’t load this")}</h2><p>{errorMessage(error)}</p>{retry && <Button variant="outline" onClick={retry}>{t("Try again")}</Button>}</div>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const { t } = useTranslation()
  return <div className="page-state"><div className="state-icon"><MagnifyingGlass size={23} /></div><h2>{t(title)}</h2><p>{t(description)}</p>{action}</div>
}

export function QueryError({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation()
  return <div className="page-error"><div className="state-icon state-error"><ArrowClockwise size={22} /></div><div><strong>{t("We couldn’t load this")}</strong><p>{errorMessage(error)}</p></div>{retry && <Button variant="outline" onClick={retry}>{t("Try again")}</Button>}</div>
}
