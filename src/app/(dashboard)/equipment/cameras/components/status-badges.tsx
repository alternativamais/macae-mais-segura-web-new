import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"

export const cameraStatusTagMap = (t: ReturnType<typeof useTranslator>) =>
  ({
    active: { label: t("table.status_active"), tone: "success" },
    inactive: { label: t("table.status_inactive"), tone: "neutral" },
  }) as const

export function CameraStatusBadge({ status }: { status?: string }) {
  const t = useTranslator("cameras")
  const map = cameraStatusTagMap(t)

  const tag = resolveDataTagDefinition(status, map, {
    label: String(status || "-").toUpperCase(),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}
