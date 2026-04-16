"use client"

import type { ReactNode } from "react"
import { DataTag } from "@/components/shared/data-tag"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import type { Locale } from "@/lib/i18n/domain/ports/translator"

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
