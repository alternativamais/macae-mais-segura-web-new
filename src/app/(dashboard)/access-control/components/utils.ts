import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/i18n/date"
import type { Locale } from "@/lib/i18n"
import {
  AccessIpBlock,
  AccessRegionAction,
  AccessUserIpRule,
  AccessUserRuleMode,
  AccessUserScheduleRule,
  DayOfWeek,
  UserLocationRecord,
} from "@/types/access-control"
import {
  DAYS_OF_WEEK,
} from "./constants"

type TranslatorLike = (key: string, params?: Record<string, string | number>) => string

export function formatDateTime(value?: string, locale: Locale = "pt-BR") {
  if (!value) return "-"

  try {
    return formatLocalizedDateTime(new Date(value), locale)
  } catch {
    return value
  }
}

export function formatDate(value?: string, locale: Locale = "pt-BR") {
  if (!value) return "-"

  try {
    return formatLocalizedDate(new Date(value), locale)
  } catch {
    return value
  }
}

export function getActiveLabel(active: boolean, t: TranslatorLike) {
  return active ? t("shared.status_active") : t("shared.status_inactive")
}

export function getActionLabel(action: AccessRegionAction | AccessUserRuleMode, t: TranslatorLike) {
  const labels: Record<AccessRegionAction | AccessUserRuleMode, string> = {
    allow: t("shared.action_allow"),
    block: t("shared.action_block"),
  }

  return labels[action] || action
}

export function getIpBlockModeLabel(mode: AccessIpBlock["mode"], t: TranslatorLike) {
  const labels: Record<AccessIpBlock["mode"], string> = {
    single: t("shared.ip_mode_single"),
    cidr: t("shared.ip_mode_cidr"),
    range: t("shared.ip_mode_range"),
  }

  return labels[mode] || mode
}

export function getUserIpMatchTypeLabel(matchType: AccessUserIpRule["matchType"], t: TranslatorLike) {
  const labels: Record<AccessUserIpRule["matchType"], string> = {
    single: t("shared.ip_mode_single"),
    cidr: t("shared.ip_mode_cidr"),
    range: t("shared.ip_mode_range"),
  }

  return labels[matchType] || matchType
}

export function getRuleValue(
  item:
    | Pick<AccessIpBlock, "mode" | "ipValue" | "cidr" | "rangeStart" | "rangeEnd">
    | Pick<AccessUserIpRule, "matchType" | "ipValue" | "cidr" | "rangeStart" | "rangeEnd">
) {
  const type = "mode" in item ? item.mode : item.matchType

  if (type === "range") {
    return `${item.rangeStart || "-"} - ${item.rangeEnd || "-"}`
  }

  return item.ipValue || item.cidr || "-"
}

export function getUserDisplayName(name?: string, email?: string) {
  if (name && email) return `${name} (${email})`
  return name || email || "-"
}

export function getDayLabel(day: DayOfWeek, t: TranslatorLike) {
  const labels: Record<DayOfWeek, string> = {
    monday: t("shared.days.monday"),
    tuesday: t("shared.days.tuesday"),
    wednesday: t("shared.days.wednesday"),
    thursday: t("shared.days.thursday"),
    friday: t("shared.days.friday"),
    saturday: t("shared.days.saturday"),
    sunday: t("shared.days.sunday"),
  }

  return labels[day] || day
}

export function getDaysSummary(days: DayOfWeek[] | null | undefined, t: TranslatorLike) {
  if (!days || days.length === 0) return t("shared.days.all")
  return days.map((day) => getDayLabel(day, t)).join(", ")
}

export function getLocationCoordinatesLabel(record: UserLocationRecord) {
  return `${normalizeCoordinate(record.latitude)}, ${normalizeCoordinate(record.longitude)}`
}

function normalizeCoordinate(value: number | string) {
  if (typeof value === "number") return value.toFixed(6)

  const parsed = Number.parseFloat(String(value).replace(",", "."))
  if (Number.isFinite(parsed)) {
    return parsed.toFixed(6)
  }

  return String(value)
}

export function getScheduleLabel(rule: AccessUserScheduleRule) {
  return `${rule.startTime} - ${rule.endTime}`
}

export function getDayOptions(t: TranslatorLike) {
  return DAYS_OF_WEEK.map((value) => ({
    value,
    label: getDayLabel(value, t),
  }))
}

export function getIpBlockModeOptions(t: TranslatorLike) {
  return ["single", "cidr", "range"].map((value) => ({
    value,
    label: getIpBlockModeLabel(value as AccessIpBlock["mode"], t),
  }))
}

export function getRegionActionOptions(t: TranslatorLike) {
  return ["block", "allow"].map((value) => ({
    value,
    label: getActionLabel(value as AccessRegionAction, t),
  }))
}

export function getUserRuleModeOptions(t: TranslatorLike) {
  return ["allow", "block"].map((value) => ({
    value,
    label: getActionLabel(value as AccessUserRuleMode, t),
  }))
}

export function getUserIpMatchTypeOptions(t: TranslatorLike) {
  return ["single", "cidr", "range"].map((value) => ({
    value,
    label: getUserIpMatchTypeLabel(value as AccessUserIpRule["matchType"], t),
  }))
}
