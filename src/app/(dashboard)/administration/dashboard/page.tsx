"use client"

import { useCallback, useEffect, useState } from "react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cameraService } from "@/services/camera.service"
import { dashboardWidgetService } from "@/services/dashboard-widget.service"
import { DashboardWidget } from "@/types/dashboard-widget"
import { Camera } from "@/types/camera"
import { DashboardWidgetsTab } from "./components/dashboard-widgets-tab"
import { StatCards } from "./components/stat-cards"

export default function DashboardManagementPage() {
  const t = useTranslator("dashboard_management")
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSharedData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [widgetData, cameraData] = await Promise.all([
        dashboardWidgetService.list(),
        cameraService.findAll({ page: 1, limit: 500 }),
      ])

      setWidgets(widgetData)
      setCameras(cameraData.data || [])
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setWidgets([])
      setCameras([])
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadSharedData()
  }, [loadSharedData])

  return (
    <ScreenGuard screenKey="admin.company_dashboards">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          <div className="space-y-6">
            <StatCards widgets={widgets} cameras={cameras} isLoading={isLoading} />
            <DashboardWidgetsTab
              widgets={widgets}
              cameras={cameras}
              isLoading={isLoading}
              onReload={loadSharedData}
            />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
