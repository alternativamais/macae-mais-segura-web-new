"use client"

import { useMemo } from "react"
import {
  Activity,
  DatabaseZap,
  Loader2,
  Thermometer,
  TowerControl,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.loading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                card.value
              )}
            </div>
            {card.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
