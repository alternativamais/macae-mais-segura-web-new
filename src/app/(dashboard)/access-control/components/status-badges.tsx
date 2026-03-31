import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"
import { getActiveLabel, getActionLabel } from "./utils"

export function ActiveStatusBadge({ active }: { active: boolean }) {
  const t = useTranslator("access_control")
  const activeTagMap = {
    true: { label: t("shared.status_active"), tone: "success" },
    false: { label: t("shared.status_inactive"), tone: "neutral" },
  } as const
  const tag = resolveDataTagDefinition(String(active), activeTagMap, {
    label: getActiveLabel(active, t),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function ActionBadge({ value }: { value: "allow" | "block" }) {
  const t = useTranslator("access_control")
  const actionTagMap = {
    allow: { label: t("shared.action_allow"), tone: "success" },
    block: { label: t("shared.action_block"), tone: "warning" },
  } as const
  const tag = resolveDataTagDefinition(value, actionTagMap, {
    label: getActionLabel(value, t),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}
