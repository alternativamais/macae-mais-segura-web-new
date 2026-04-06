"use client"

import { Loader2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import {
  ClimateDashboardRange,
  ClimateDashboardResponse,
  ClimateEquipment,
  ClimateTotemDashboardResponse,
  ClimateTotemOption,
} from "@/types/climate-equipment"
import { SensorChartCard } from "./sensor-chart-card"
import { getClimateEquipmentDisplayName } from "./utils"

interface ClimateDashboardTabProps {
  equipments: ClimateEquipment[]
  totemOptions: ClimateTotemOption[]
  selectedEquipmentId: number | null
  selectedTotemId: string
  range: ClimateDashboardRange
  equipmentDashboard: ClimateDashboardResponse | null
  totemDashboard: ClimateTotemDashboardResponse | null
  isLoading: boolean
  error: string
  onEquipmentChange: (value: string) => void
  onTotemChange: (value: string) => void
  onRangeChange: (value: ClimateDashboardRange) => void
  onRefresh: () => void
}

const NO_EQUIPMENT_VALUE = "__none_equipment__"
const NO_TOTEM_VALUE = "__all_totems__"

export function ClimateDashboardTab(props: ClimateDashboardTabProps) {
  const t = useTranslator("climate_equipment.dashboard")
  const activeSensors = props.selectedTotemId
    ? (props.totemDashboard?.sensors ?? [])
    : (props.equipmentDashboard?.sensors ?? [])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 xl:grid-cols-12 xl:items-end">
          <div className="xl:col-span-10">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("filters.equipment")}
                </label>
                <Select
                  value={
                    props.selectedEquipmentId
                      ? String(props.selectedEquipmentId)
                      : NO_EQUIPMENT_VALUE
                  }
                  onValueChange={props.onEquipmentChange}
                  disabled={!!props.selectedTotemId}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t("filters.select_equipment")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_EQUIPMENT_VALUE}>
                      {t("filters.select_equipment")}
                    </SelectItem>
                    {props.equipments.map((equipment) => (
                      <SelectItem key={equipment.id} value={String(equipment.id)}>
                        {getClimateEquipmentDisplayName(equipment, t("not_informed"))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("filters.totem")}
                </label>
                <Select
                  value={props.selectedTotemId || NO_TOTEM_VALUE}
                  onValueChange={props.onTotemChange}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t("filters.all_totems")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TOTEM_VALUE}>{t("filters.all_totems")}</SelectItem>
                    {props.totemOptions.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.numero || `#${option.id}`}
                        {option.pontoDeReferencia ? ` - ${option.pontoDeReferencia}` : ""}
                        {option.equipmentCount ? ` (${option.equipmentCount})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("filters.range")}
                </label>
                <Select
                  value={props.range}
                  onValueChange={(value) =>
                    props.onRangeChange(value as ClimateDashboardRange)
                  }
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">{t("ranges.30m")}</SelectItem>
                    <SelectItem value="1h">{t("ranges.1h")}</SelectItem>
                    <SelectItem value="12h">{t("ranges.12h")}</SelectItem>
                    <SelectItem value="1d">{t("ranges.1d")}</SelectItem>
                    <SelectItem value="1s">{t("ranges.1s")}</SelectItem>
                    <SelectItem value="1m">{t("ranges.1m")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end xl:col-span-2">
            <Button
              variant="outline"
              onClick={props.onRefresh}
              disabled={props.isLoading}
              className="cursor-pointer"
            >
              {props.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t("actions.refresh")}
            </Button>
          </div>
        </div>
      </div>

      {props.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-lg border bg-card">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        </div>
      ) : props.error ? (
        <div className="rounded-lg border-2 border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          {props.error}
        </div>
      ) : activeSensors.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {activeSensors.map((sensor) => (
            <SensorChartCard key={`${sensor.equipmentId || "eq"}-${sensor.id}`} sensor={sensor} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}
    </div>
  )
}
