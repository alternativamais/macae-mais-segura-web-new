import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"

export const climateEquipmentStatusTagMap = (t: ReturnType<typeof useTranslator>) =>
  ({
    active: { label: t("table.status_active"), tone: "success" },
    inactive: { label: t("table.status_inactive"), tone: "neutral" },
  }) as const

export function ClimateEquipmentStatusBadge({ status }: { status?: string }) {
  const t = useTranslator("climate_equipment")
  const map = climateEquipmentStatusTagMap(t)

  const tag = resolveDataTagDefinition(status, map, {
    label: String(status || "-").toUpperCase(),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function ClimateSensorAvailabilityBadge({
  available,
}: {
  available?: boolean
}) {
  const t = useTranslator("climate_equipment")

  return (
    <DataTag tone={available ? "success" : "neutral"}>
      {available ? t("dashboard.sensor_available") : t("dashboard.sensor_unavailable")}
    </DataTag>
  )
}
