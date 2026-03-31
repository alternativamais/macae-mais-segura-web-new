import { BackupMetadata, BackupRecord } from "@/types/backup"
import type { Locale } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"

export function formatDateTime(value?: string | null, locale: Locale = "pt-BR") {
  if (!value) return "-"

  try {
    return formatLocalizedDateTime(new Date(value), locale)
  } catch {
    return value
  }
}

export function formatBytes(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "-"

  const bytes = Number(value)

  if (!Number.isFinite(bytes) || bytes <= 0) return "-"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const formatted = bytes / 1024 ** index

  return `${formatted.toFixed(formatted >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export function getBackupSummary(record?: BackupRecord | null) {
  const metadata = (record?.metadata || null) as BackupMetadata | null

  return {
    generatedAt: metadata?.generatedAt || null,
    tableCount: typeof metadata?.tableCount === "number" ? metadata.tableCount : null,
    rowCount: typeof metadata?.rowCount === "number" ? metadata.rowCount : null,
    sequenceCount: typeof metadata?.sequenceCount === "number" ? metadata.sequenceCount : null,
    notes: metadata?.notes || null,
    format: metadata?.format || null,
  }
}

export function getInitiatedByLabel(t: any, value?: string | null) {
  return value === "scheduled" ? t("origin_scheduled") : t("origin_manual")
}

export function getFrequencyLabel(t: any, value: number) {
  if (value % (24 * 60) === 0) {
    const days = value / (24 * 60)
    return days === 1 ? t("freq_daily") : t("freq_days", { days })
  }

  if (value % 60 === 0) {
    const hours = value / 60
    return hours === 1 ? t("freq_1hour") : t("freq_hours", { hours })
  }

  return t("freq_minutes", { minutes: value })
}

export function getStatusDescription(t: any, status: BackupRecord["status"]) {
  if (status === "completed") return t("status_completed")
  if (status === "failed") return t("status_failed")
  return t("status_running")
}

export function formatLocaleNumber(value: number | string | null | undefined, locale: Locale) {
  if (value === null || value === undefined || value === "") return "-"

  const numericValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numericValue)) return String(value)

  return new Intl.NumberFormat(locale).format(numericValue)
}
