import { resolveDataTagDefinition, DataTag } from "@/components/shared/data-tag"
import type { ITranslator } from "@/lib/i18n/domain/ports/translator"
import { useTranslator } from "@/lib/i18n"

export const companyStatusTagMap = (t: ITranslator) => ({
  active: { label: t("table.status_active"), tone: "success" },
  inactive: { label: t("table.status_inactive"), tone: "neutral" },
} as const)

export function CompanyStatusBadge({ status }: { status?: string }) {
  const t = useTranslator("companies")
  const map = companyStatusTagMap(t)
  
  const tag = resolveDataTagDefinition(status, map, {
    label: String(status || "-").toUpperCase(),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}
