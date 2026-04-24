"use client"

import type { ReactNode } from "react"
import { DataTag, type DataTagTone } from "@/components/shared/data-tag"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import type { Locale } from "@/lib/i18n/domain/ports/translator"
import type { EmailPlateAlertRule, EmailPlateAlertRuleFilters } from "@/types/email-integration"

export function formatEmailIntegrationDateTime(
  value: string | null | undefined,
  locale: Locale,
) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return formatLocalizedDateTime(date, locale)
}

export function getCompanyName(
  companyNameById: Map<number, string>,
  empresaId: number | null | undefined,
  fallback = "-",
) {
  if (typeof empresaId !== "number") return fallback
  return companyNameById.get(empresaId) || `#${empresaId}`
}

export function getEnvironmentLabel(
  environmentTag: string | null | undefined,
  labels: { prod: string; dev: string },
) {
  return environmentTag === "dev" ? labels.dev : labels.prod
}

export function getSecurityLabel(
  secure: boolean,
  labels: { secure: string; starttls: string },
) {
  return secure ? labels.secure : labels.starttls
}

export function getWhatsappRecipientTypeLabel(
  type: string | null | undefined,
  labels: { manual: string; contact: string; group: string },
) {
  if (type === "group") return labels.group
  if (type === "contact") return labels.contact
  return labels.manual
}

export function getWhatsappSessionTag(
  sessionStatus: string | null | undefined,
  labels: Record<string, string>,
) {
  const status = sessionStatus || "disconnected"
  const tone: DataTagTone =
    status === "ready"
      ? "success"
      : status === "qr_required" ||
          status === "authenticated" ||
          status === "starting" ||
          status === "syncing_remote_session" ||
          status === "reconnecting"
        ? "accent"
        : status === "auth_failure" || status === "error"
          ? "danger"
          : "neutral"

  return <DataTag tone={tone}>{labels[status] || status}</DataTag>
}

export function getEnabledTag(
  enabled: boolean,
  labels: { enabled: string; disabled: string },
) {
  return (
    <DataTag tone={enabled ? "success" : "neutral"}>
      {enabled ? labels.enabled : labels.disabled}
    </DataTag>
  )
}

export function getEnvironmentTag(
  environmentTag: string | null | undefined,
  labels: { prod: string; dev: string },
) {
  return (
    <DataTag tone={environmentTag === "dev" ? "info" : "accent"}>
      {getEnvironmentLabel(environmentTag, labels)}
    </DataTag>
  )
}

export function renderTagList(
  items: string[],
  tone: "info" | "neutral" | "accent" = "info",
  fallback = "-",
): ReactNode {
  if (items.length === 0) return fallback

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <DataTag key={item} tone={tone} monospace={tone === "info"}>
          {item}
        </DataTag>
      ))}
    </div>
  )
}

export function hasEmailRuleCriteria(rule: Pick<EmailPlateAlertRule, "plates" | "filters">) {
  return rule.plates.length > 0 || hasEmailRuleFilterConfig(rule.filters)
}

export function hasEmailRuleFilterConfig(filters?: EmailPlateAlertRuleFilters | null) {
  if (!filters) return false

  return Boolean(
    filters.directions?.length ||
      filters.plateColors?.length ||
      filters.vehicleColors?.length ||
      filters.vehicleTypes?.length ||
      filters.vehicleBrands?.length ||
      filters.vehicleSeries?.length ||
      filters.plateTypes?.length ||
      filters.regions?.length ||
      filters.channels?.length ||
      filters.deviceIds?.length ||
      typeof filters.minConfidence === "number" ||
      typeof filters.maxConfidence === "number" ||
      typeof filters.speedThresholdKmh === "number" ||
      typeof filters.minPeopleCount === "number" ||
      typeof filters.maxPeopleCount === "number" ||
      typeof filters.requiresExistingPlate === "boolean",
  )
}

export function getEmailRuleCriteriaSummary(
  rule: Pick<EmailPlateAlertRule, "plates" | "filters">,
  labels: {
    plates: string
    speed: string
    vehicleColors: string
    vehicleTypes: string
    vehicleBrands: string
    directions: string
    noCriteria: string
    directionValues?: Record<string, string>
    vehicleColorValues?: Record<string, string>
    vehicleTypeValues?: Record<string, string>
    vehicleBrandValues?: Record<string, string>
  },
) {
  const parts: string[] = []
  const { filters } = rule

  if (rule.plates.length) {
    parts.push(`${labels.plates}: ${rule.plates.length}`)
  }
  if (typeof filters?.speedThresholdKmh === "number") {
    parts.push(`${labels.speed}: > ${filters.speedThresholdKmh}`)
  }
  if (filters?.vehicleColors?.length) {
    parts.push(
      `${labels.vehicleColors}: ${filters.vehicleColors
        .map((value) => labels.vehicleColorValues?.[value] || value)
        .join(", ")}`,
    )
  }
  if (filters?.vehicleTypes?.length) {
    parts.push(
      `${labels.vehicleTypes}: ${filters.vehicleTypes
        .map((value) => labels.vehicleTypeValues?.[value] || value)
        .join(", ")}`,
    )
  }
  if (filters?.vehicleBrands?.length) {
    parts.push(
      `${labels.vehicleBrands}: ${filters.vehicleBrands
        .map((value) => labels.vehicleBrandValues?.[value] || value)
        .join(", ")}`,
    )
  }
  if (filters?.directions?.length) {
    parts.push(
      `${labels.directions}: ${filters.directions
        .map((value) => labels.directionValues?.[value] || value)
        .join(", ")}`,
    )
  }

  return parts.length ? parts : [labels.noCriteria]
}
