"use client"

import { useCallback, useEffect, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslator } from "@/lib/i18n"
import { climateEquipmentService } from "@/services/climate-equipment.service"
import {
  ClimateDashboardRange,
  ClimateDashboardResponse,
  ClimateEquipment,
  ClimateTotemDashboardResponse,
  ClimateTotemOption,
} from "@/types/climate-equipment"
import { ClimateDashboardTab } from "./components/climate-dashboard-tab"
import { DashboardStatCards } from "./components/dashboard-stat-cards"
import { ClimateEquipmentTab } from "./components/climate-equipment-tab"
import { StatCards } from "./components/stat-cards"
import { buildClimateDashboardParams } from "./components/utils"

export default function ClimateEquipmentPage() {
  const t = useTranslator("climate_equipment")

  const [activeTab, setActiveTab] = useState("equipments")
  const [items, setItems] = useState<ClimateEquipment[]>([])
  const [totemOptions, setTotemOptions] = useState<ClimateTotemOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null)
  const [selectedTotemId, setSelectedTotemId] = useState("")
  const [range, setRange] = useState<ClimateDashboardRange>("30m")
  const [equipmentDashboard, setEquipmentDashboard] = useState<ClimateDashboardResponse | null>(null)
  const [totemDashboard, setTotemDashboard] = useState<ClimateTotemDashboardResponse | null>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState("")

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [equipmentsData, totemOptionsData] = await Promise.all([
        climateEquipmentService.findAllNoPagination(),
        climateEquipmentService.listTotemOptions().catch(() => []),
      ])

      setItems(equipmentsData)
      setTotemOptions(totemOptionsData)

      setSelectedEquipmentId((current) => {
        if (current && equipmentsData.some((item) => item.id === current)) {
          return current
        }

        return equipmentsData[0]?.id ?? null
      })

      setSelectedTotemId((current) => {
        if (current && totemOptionsData.some((option) => String(option.id) === current)) {
          return current
        }

        return ""
      })
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setItems([])
      setTotemOptions([])
      setSelectedEquipmentId(null)
      setSelectedTotemId("")
    } finally {
      setIsLoading(false)
    }
  }, [t])

  const loadDashboard = useCallback(
    async (options?: { silent?: boolean }) => {
      const { silent = false } = options || {}
      const params = buildClimateDashboardParams(range)

      if (!silent) {
        setIsDashboardLoading(true)
        setDashboardError("")
      }

      try {
        if (selectedTotemId) {
          const data = await climateEquipmentService.getTotemDashboard(
            Number(selectedTotemId),
            params,
          )
          setTotemDashboard(data)
          setEquipmentDashboard(null)
          return
        }

        if (!selectedEquipmentId) {
          setEquipmentDashboard(null)
          setTotemDashboard(null)
          return
        }

        const data = await climateEquipmentService.getDashboard(selectedEquipmentId, params)
        setEquipmentDashboard(data)
        setTotemDashboard(null)
      } catch (error) {
        if (!silent) {
          setEquipmentDashboard(null)
          setTotemDashboard(null)
          toast.apiError(error, t("dashboard.load_error"))
        }
        setDashboardError(t("dashboard.load_error"))
      } finally {
        if (!silent) {
          setIsDashboardLoading(false)
        }
      }
    },
    [range, selectedEquipmentId, selectedTotemId, t],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeTab !== "dashboard") return
    if (!selectedTotemId && !selectedEquipmentId) return

    loadDashboard()
  }, [activeTab, loadDashboard, selectedEquipmentId, selectedTotemId, range])

  useEffect(() => {
    if (activeTab !== "dashboard") return
    if (!selectedTotemId && !selectedEquipmentId) return

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      void loadDashboard({ silent: true })
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [activeTab, loadDashboard, selectedEquipmentId, selectedTotemId, range])

  return (
    <ScreenGuard screenKey="admin.climate_equipment">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          {activeTab === "dashboard" ? (
            <DashboardStatCards
              equipments={items}
              selectedEquipmentId={selectedEquipmentId}
              selectedTotemId={selectedTotemId}
              equipmentDashboard={equipmentDashboard}
              totemDashboard={totemDashboard}
              isLoading={isDashboardLoading}
            />
          ) : (
            <StatCards items={items} isLoading={isLoading} />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="equipments">{t("tabs.equipments")}</TabsTrigger>
              <TabsTrigger value="dashboard">{t("tabs.dashboard")}</TabsTrigger>
            </TabsList>

            <TabsContent value="equipments" className="mt-4">
              <ClimateEquipmentTab
                items={items}
                isLoading={isLoading}
                onOpenDashboard={(id) => {
                  setSelectedTotemId("")
                  setSelectedEquipmentId(id)
                  setActiveTab("dashboard")
                }}
                onRefreshData={loadData}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-4">
              <ClimateDashboardTab
                equipments={items}
                totemOptions={totemOptions}
                selectedEquipmentId={selectedEquipmentId}
                selectedTotemId={selectedTotemId}
                range={range}
                equipmentDashboard={equipmentDashboard}
                totemDashboard={totemDashboard}
                isLoading={isDashboardLoading}
                error={dashboardError}
                onEquipmentChange={(value) => {
                  setSelectedTotemId("")
                  setSelectedEquipmentId(value === "__none_equipment__" ? null : Number(value))
                }}
                onTotemChange={(value) => {
                  if (value === "__all_totems__") {
                    setSelectedTotemId("")
                    return
                  }

                  setSelectedTotemId(value)
                }}
                onRangeChange={setRange}
                onRefresh={() => void loadDashboard()}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
