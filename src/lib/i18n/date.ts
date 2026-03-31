import { format } from "date-fns"
import { enUS, ptBR } from "date-fns/locale"
import type { Locale } from "./domain/ports/translator"

export function getDateFnsLocale(locale: Locale) {
  return locale === "pt-BR" ? ptBR : enUS
}

export function formatLocalizedDate(date: Date, locale: Locale) {
  return format(date, "P", {
    locale: getDateFnsLocale(locale),
  })
}

export function formatLocalizedDateTime(date: Date, locale: Locale) {
  return format(date, "Pp", {
    locale: getDateFnsLocale(locale),
  })
}
