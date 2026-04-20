"use client"

import { BarChart3, Building2, Camera, LayoutGrid } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useTranslator } from "@/lib/i18n"
import { DashboardWidget } from "@/types/dashboard-widget"
import { Camera as CameraType } from "@/types/camera"

interface StatCardsProps {
  widgets: DashboardWidget[]
  cameras: CameraType[]
  isLoading: boolean
}

export function StatCards({ widgets, cameras, isLoading }: StatCardsProps) {
  const t = useTranslator("dashboard_management")
  const { isAllCompanies } = useCompanyVisibility()

  const totalWidgets = widgets.length
  const activeWidgets = widgets.filter((widget) => widget.enabled).length
  const companiesCount = new Set(widgets.map((widget) => widget.empresaId)).size

  const items = [
    {
      title: t("stats.total"),
      value: totalWidgets,
      icon: LayoutGrid,
      description: t("stats.total_desc"),
    },
    {
      title: t("stats.active"),
      value: activeWidgets,
      icon: BarChart3,
      description: t("stats.active_desc"),
    },
    {
      title: t("stats.cameras"),
      value: cameras.length,
      icon: Camera,
      description: t("stats.cameras_desc"),
    },
    {
      title: t("stats.companies"),
      value: isAllCompanies ? companiesCount : 1,
      icon: Building2,
      description: t("stats.companies_desc"),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
