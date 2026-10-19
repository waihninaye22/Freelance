import { en } from "../i18n/en.js";
import { my } from "../i18n/my.js";

export type Locale = "en" | "my";

export function requestLocale(acceptLanguage: string | undefined): Locale {
  return acceptLanguage?.split(",").some((entry) => /^\s*(my|my-MM)(\s*;|\s*$)/i.test(entry)) ? "my" : "en";
}

export function localizedMessage(message: string, locale: Locale) {
  if (locale === "en") return en[message as keyof typeof en] ?? message;
  return my[message as keyof typeof my] ?? message;
}
