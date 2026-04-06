import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"
import { NetworkEquipmentType } from "@/types/network-equipment"
import { getNetworkEquipmentTypeLabel } from "./utils"

export const networkEquipmentStatusTagMap = (t: ReturnType<typeof useTranslator>) =>
  ({
    active: { label: t("table.status_active"), tone: "success" },
    inactive: { label: t("table.status_inactive"), tone: "neutral" },
  }) as const

export function NetworkEquipmentStatusBadge({ status }: { status?: string }) {
  const t = useTranslator("network_equipment")
  const map = networkEquipmentStatusTagMap(t)

  const tag = resolveDataTagDefinition(status, map, {
    label: String(status || "-").toUpperCase(),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function NetworkEquipmentOnlineBadge({ online }: { online?: boolean }) {
  const t = useTranslator("network_equipment")

  return (
    <DataTag tone={online ? "success" : "neutral"}>
      {online ? t("table.online.true") : t("table.online.false")}
    </DataTag>
  )
}

export function NetworkEquipmentTypeBadge({
  type,
}: {
  type?: NetworkEquipmentType | string | null
}) {
  const t = useTranslator("network_equipment")
  const label = getNetworkEquipmentTypeLabel(type, {
    router: t("types.router"),
    onu: t("types.onu"),
    radio: t("types.radio"),
    switch: t("types.switch"),
    unknown: t("shared.not_informed"),
  })

  const tone =
    type === "roteador"
      ? "info"
      : type === "onu"
        ? "warning"
        : type === "radio"
          ? "accent"
          : type === "switch"
            ? "success"
            : "neutral"

  return <DataTag tone={tone}>{label}</DataTag>
}
