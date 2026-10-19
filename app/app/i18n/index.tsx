import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import en from "./en"
import my from "./my"

export type Language = "en" | "my"
type TranslationContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string }
const LanguageContext = createContext<TranslationContextValue | null>(null)
const storageKey = "archer.language"

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => typeof window === "undefined" ? "en" : window.localStorage.getItem(storageKey) === "my" ? "my" : "en")
  useEffect(() => {
    window.localStorage.setItem(storageKey, language)
    document.documentElement.lang = language === "my" ? "my-MM" : "en"
  }, [language])
  const value = useMemo<TranslationContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => language === "my" ? (my as Record<string, string>)[key] ?? key : (en as Record<string, string>)[key] ?? key,
  }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useTranslation must be used within LanguageProvider")
  return context
}

export function translateNotification(type: string, message: string, t: (key: string) => string) {
  const title = message.match(/[“"](.+?)[”"]/u)?.[1]
  if (type === "proposal_received" && title) {
    const name = message.split(" submitted a proposal")[0]
    return t("{name} submitted a proposal for “{job}”.").replace("{name}", name).replace("{job}", title)
  }
  if (type.startsWith("proposal_") && title) {
    const status = type.slice("proposal_".length)
    return t("Your proposal for “{job}” was {status}.").replace("{job}", title).replace("{status}", t(status))
  }
  if (type === "hired" && title) return t("You were hired for “{job}”.").replace("{job}", title)
  if (type === "project_created" && title) return t("Your project for “{job}” is ready.").replace("{job}", title)
  if (type === "work_submitted" && title) return t("Work was submitted for “{job}”.").replace("{job}", title)
  if (type === "project_completed" && title) return t("The project “{job}” was marked complete.").replace("{job}", title)
  if (type === "project_message") return t("You have a new project message.")
  if (type === "cancellation_requested") return t("A project participant requested cancellation.")
  return message
}
