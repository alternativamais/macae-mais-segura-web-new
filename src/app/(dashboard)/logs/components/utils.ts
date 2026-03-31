"use client"

import { parseISO } from "date-fns"
import type { ITranslator, Locale } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { AuditLogRecord, ClientOrigin, LogLevel } from "@/types/log"

export function formatLogDateTime(value: string | undefined, locale: Locale) {
  if (!value) return "-"

  try {
    return formatLocalizedDateTime(parseISO(value), locale)
  } catch {
    return value
  }
}

export function getLogLevelLabel(level: LogLevel | undefined, t: ITranslator) {
  if (!level) return "-"

  const normalizedLevel = String(level).toLowerCase()
  const translationKey = `shared.levels.${normalizedLevel}`

  const translated = t(translationKey)
  return translated === translationKey ? String(level) : translated
}

export function getOriginLabel(origin: ClientOrigin | undefined, t: ITranslator) {
  if (!origin) return "-"

  const translationKey = `shared.origins.${origin}`
  const translated = t(translationKey)
  return translated === translationKey ? String(origin) : translated
}

export function safeJsonStringify(value: unknown) {
  if (value == null) return "-"

  try {
    if (typeof value === "string") return value
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function getUserLogLabel(
  log: {
    userName?: string
    userUsername?: string
    userId?: number | null
  },
  t: ITranslator,
) {
  if (log.userName && log.userUsername) {
    return `${log.userName} (${log.userUsername})`
  }

  if (log.userName) return log.userName
  if (log.userUsername) return log.userUsername
  if (log.userId) return `#${log.userId}`
  return t("shared.empty_value")
}

export function getAuditEntityLabel(log: AuditLogRecord, t: ITranslator) {
  return [log.entity, log.entityId].filter(Boolean).join(" • ") || t("shared.no_entity")
}

export function formatDuration(value: number | undefined, t: ITranslator) {
  if (typeof value !== "number") return t("shared.empty_value")

  if (value < 1000) {
    return t("shared.duration_ms", { value })
  }

  return t("shared.duration_seconds", { value: (value / 1000).toFixed(2) })
}
