"use client"

import { useMemo } from "react"
import {
  Activity,
  DatabaseZap,
  Thermometer,
  TowerControl,
} from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import {
  ClimateDashboardResponse,
  ClimateEquipment,
  ClimateTotemDashboardResponse,
} from "@/types/climate-equipment"
import { formatClimateDateTime, getClimateEquipmentDisplayName } from "./utils"

interface DashboardStatCardsProps {
  equipments: ClimateEquipment[]
  selectedEquipmentId: number | null
  selectedTotemId: string
  equipmentDashboard: ClimateDashboardResponse | null
  totemDashboard: ClimateTotemDashboardResponse | null
  isLoading?: boolean
}

export function DashboardStatCards({
  equipments,
  selectedEquipmentId,
  selectedTotemId,
  equipmentDashboard,
  totemDashboard,
  isLoading = false,
}: DashboardStatCardsProps) {
  const t = useTranslator("climate_equipment.dashboard")
  const locale = t.getLocale()

  const activeSensors = selectedTotemId
    ? (totemDashboard?.sensors ?? [])
    : (equipmentDashboard?.sensors ?? [])
  const activeEquipmentCount = selectedTotemId
    ? (totemDashboard?.equipments.length ?? 0)
    : equipmentDashboard
      ? 1
      : 0
  const availableSensors = activeSensors.filter((sensor) => sensor.isAvailable).length

  const latestSyncedAt = useMemo(() => {
    if (selectedTotemId) {
      const dates = (totemDashboard?.equipments ?? [])
        .map((item) => item.lastSyncedAt)
        .filter(Boolean) as string[]

      if (!dates.length) return null

      return dates.sort()[dates.length - 1] || null
    }

    return equipmentDashboard?.equipment.lastSyncedAt || null
  }, [equipmentDashboard, selectedTotemId, totemDashboard])

  const selectedEquipmentLabel = useMemo(() => {
    const item = equipments.find((equipment) => equipment.id === selectedEquipmentId)
    return item ? getClimateEquipmentDisplayName(item, t("not_informed")) : null
  }, [equipments, selectedEquipmentId, t])

  const cards = [
    {
      title: t("summary.scope"),
      value: selectedTotemId
        ? t("summary.totem_value", {
            value: totemDashboard?.totem.numero || `#${selectedTotemId}`,
          })
        : selectedEquipmentLabel || t("summary.select_equipment"),
      description: null,
      icon: TowerControl,
      loading: false,
    },
    {
      title: t("summary.equipments"),
      value: String(activeEquipmentCount),
      description: null,
      icon: DatabaseZap,
      loading: isLoading,
    },
    {
      title: t("summary.sensors"),
      value: String(activeSensors.length),
      description: t("summary.available_sensors", {
        count: availableSensors,
        total: activeSensors.length,
      }),
      icon: Activity,
      loading: isLoading,
    },
    {
      title: t("summary.last_sync"),
      value: formatClimateDateTime(latestSyncedAt, locale),
      description: null,
      icon: Thermometer,
      loading: isLoading,
    },
  ]

  return (
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        valueClassName: card.title === t("summary.scope") || card.title === t("summary.last_sync")
          ? "text-sm md:text-2xl"
          : undefined,
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
