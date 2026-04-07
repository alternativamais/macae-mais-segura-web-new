import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"

export function ExtensionStatusBadge({ status }: { status?: string | null }) {
  const t = useTranslator("call_center_extensions")
  const tag = resolveDataTagDefinition(
    status,
    {
      active: { label: t("table.status_active"), tone: "success" },
      inactive: { label: t("table.status_inactive"), tone: "neutral" },
    },
    {
      label: String(status || t("shared.not_informed")).toUpperCase(),
      tone: "neutral",
    },
  )

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function ExtensionTypeBadge({ type }: { type?: string | null }) {
  const t = useTranslator("call_center_extensions")
  const tag = resolveDataTagDefinition(
    type,
    {
      operator: { label: t("table.type_operator"), tone: "info" },
      totem: { label: t("table.type_totem"), tone: "warning" },
    },
    {
      label: String(type || t("shared.not_informed")).toUpperCase(),
      tone: "neutral",
    },
  )

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}
