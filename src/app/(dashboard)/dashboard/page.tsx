"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Filter, LayoutDashboard, RefreshCcw, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAuthStore } from "@/store/auth-store"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cn } from "@/lib/utils"
import { dashboardWidgetService } from "@/services/dashboard-widget.service"
import { cameraService } from "@/services/camera.service"
import { Camera } from "@/types/camera"
import {
  DashboardWidgetGranularity,
  DashboardWidgetPeriod,
  DashboardWidgetRuntime,
} from "@/types/dashboard-widget"
import { LprVehicleCountWidgetCard } from "./components/lpr-vehicle-count-widget-card"

function CameraFilterField({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
}: {
  items: Array<{ id: string; label: string; description?: string | null }>
  value: string[]
  onChange: (nextValue: string[]) => void
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  clearLabel: string
}) {
  const selectedItems = items.filter((item) => value.includes(item.id))
  const triggerLabel = (() => {
    if (!selectedItems.length) return placeholder
    if (selectedItems.length === 1) return selectedItems[0]?.label || placeholder
    return `${selectedItems[0]?.label || placeholder} +${selectedItems.length - 1}`
  })()

  const toggleItem = (itemId: string) => {
    if (value.includes(itemId)) {
      onChange(value.filter((current) => current !== itemId))
      return
    }

    onChange([...value, itemId])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "min-w-[170px] cursor-pointer justify-between gap-2 text-left font-normal",
            !selectedItems.length && "text-muted-foreground",
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          {selectedItems.length ? (
            <Badge variant="secondary" className="rounded-sm px-1.5 py-0 text-[10px]">
              {selectedItems.length}
            </Badge>
          ) : null}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const checked = value.includes(item.id)
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description || ""}`}
                    onSelect={() => toggleItem(item.id)}
                    className="cursor-pointer items-start gap-2 py-3"
                  >
                    <Checkbox
                      checked={checked}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.label}</p>
                      {item.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {value.length ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="cursor-pointer justify-center text-center"
                  >
                    {clearLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function DashboardPage() {
  const t = useTranslator("dashboard")
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)
  const [widgets, setWidgets] = useState<DashboardWidgetRuntime[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [periodOverride, setPeriodOverride] = useState<DashboardWidgetPeriod | "default">("default")
  const [granularityOverride, setGranularityOverride] = useState<DashboardWidgetGranularity | "default">("default")
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const activeCompany = useMemo(() => {
    if (activeCompanyId === "ALL" || activeCompanyId === null) return null
    return availableCompanies.find((company) => String(company.id) === String(activeCompanyId)) || null
  }, [activeCompanyId, availableCompanies])

  const companyCameras = useMemo(() => {
    if (!activeCompany || activeCompanyId === "ALL") return []
    return cameras.filter((camera) => String(camera.empresaId) === String(activeCompany.id))
  }, [activeCompany, activeCompanyId, cameras])

  const companyCameraOptions = useMemo(
    () =>
      companyCameras.map((camera) => ({
        id: String(camera.id),
        label: camera.nome || `Câmera ${camera.id}`,
        description: camera.ip || null,
      })),
    [companyCameras],
  )

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = []

    if (periodOverride !== "default") {
      badges.push(t(`widgets.vehicle_count.periods.${periodOverride}`))
    }

    if (granularityOverride !== "default") {
      badges.push(t(`filters.granularities.${granularityOverride}`))
    }

    if (selectedCameraIds.length) {
      badges.push(
        selectedCameraIds.length === 1
          ? companyCameraOptions.find((item) => item.id === selectedCameraIds[0])?.label || t("filters.labels.cameras")
          : t("filters.camera_count", { count: selectedCameraIds.length }),
      )
    }

    return badges
  }, [companyCameraOptions, granularityOverride, periodOverride, selectedCameraIds, t])

  const loadDashboard = useCallback(async () => {
    if (activeCompanyId === "ALL") {
      setWidgets([])
      setCameras([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const companyId = activeCompany ? Number(activeCompany.id) : undefined
      const [widgetData, cameraData] = await Promise.all([
        dashboardWidgetService.listDashboard({
          empresaId: companyId,
          cameraIds: selectedCameraIds.length ? selectedCameraIds.map(Number) : undefined,
          period: periodOverride === "default" ? undefined : periodOverride,
          granularity: granularityOverride === "default" ? undefined : granularityOverride,
        }),
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
  }, [activeCompany, activeCompanyId, granularityOverride, periodOverride, selectedCameraIds, t])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const validIds = selectedCameraIds.filter((cameraId) =>
      companyCameraOptions.some((camera) => camera.id === cameraId),
    )

    if (validIds.length !== selectedCameraIds.length) {
      setSelectedCameraIds(validIds)
    }
  }, [companyCameraOptions, selectedCameraIds])

  if (activeCompanyId === "ALL") {
    return (
      <div className="flex-1 space-y-6 px-6 pt-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("all_companies.title")}
            </CardTitle>
            <CardDescription>{t("all_companies.description")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
          {activeCompany ? (
            <p className="text-sm text-muted-foreground">
              {t("company_scope", { company: activeCompany.nome })}
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/administration/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t("manage_action")}
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl border bg-card">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>{t("filters.title")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilterBadges.length ? (
                  activeFilterBadges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="rounded-sm">
                      {badge}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("filters.empty_state")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {periodOverride !== "default" ||
              granularityOverride !== "default" ||
              selectedCameraIds.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPeriodOverride("default")
                    setGranularityOverride("default")
                    setSelectedCameraIds([])
                  }}
                  className="cursor-pointer"
                >
                  {t("filters.actions.clear_all")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen(true)}
                className="cursor-pointer"
              >
                <Filter className="mr-2 h-4 w-4" />
                {t("filters.actions.open")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("filters.title")}</DialogTitle>
            <DialogDescription>{t("filters.modal_description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("filters.labels.period")}</p>
              <ToggleGroup
                type="single"
                value={periodOverride}
                onValueChange={(value) => value && setPeriodOverride(value as any)}
                variant="outline"
                size="sm"
                className="flex flex-wrap"
              >
                <ToggleGroupItem value="default" className="min-w-[64px] cursor-pointer">
                  {t("filters.auto")}
                </ToggleGroupItem>
                <ToggleGroupItem value="today" className="min-w-[64px] cursor-pointer">
                  {t("widgets.vehicle_count.periods.today")}
                </ToggleGroupItem>
                <ToggleGroupItem value="7d" className="min-w-[56px] cursor-pointer">
                  7D
                </ToggleGroupItem>
                <ToggleGroupItem value="30d" className="min-w-[60px] cursor-pointer">
                  30D
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("filters.labels.granularity")}</p>
              <ToggleGroup
                type="single"
                value={granularityOverride}
                onValueChange={(value) => value && setGranularityOverride(value as any)}
                variant="outline"
                size="sm"
                className="flex flex-wrap"
              >
                <ToggleGroupItem value="default" className="min-w-[64px] cursor-pointer">
                  {t("filters.auto")}
                </ToggleGroupItem>
                <ToggleGroupItem value="hour" className="min-w-[80px] cursor-pointer">
                  {t("filters.granularities.hour")}
                </ToggleGroupItem>
                <ToggleGroupItem value="day" className="min-w-[80px] cursor-pointer">
                  {t("filters.granularities.day")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("filters.labels.cameras")}</p>
              <CameraFilterField
                items={companyCameraOptions}
                value={selectedCameraIds}
                onChange={setSelectedCameraIds}
                placeholder={t("filters.placeholders.cameras")}
                searchPlaceholder={t("filters.placeholders.search_cameras")}
                emptyLabel={t("filters.empty.cameras")}
                clearLabel={t("filters.actions.clear_cameras")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPeriodOverride("default")
                setGranularityOverride("default")
                setSelectedCameraIds([])
              }}
              className="cursor-pointer"
            >
              {t("filters.actions.clear_all")}
            </Button>
            <Button
              type="button"
              onClick={() => setIsFiltersOpen(false)}
              className="cursor-pointer"
            >
              {t("filters.actions.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {widgets.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={widget.size === "full" ? "xl:col-span-2" : undefined}
            >
              {widget.type === "lpr_vehicle_count" ? (
                <LprVehicleCountWidgetCard widget={widget} />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>{isLoading ? t("loading_title") : t("empty.title")}</CardTitle>
            <CardDescription>
              {isLoading ? t("loading_description") : t("empty.description")}
            </CardDescription>
          </CardHeader>
          {!isLoading ? (
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild className="cursor-pointer">
                <Link href="/administration/dashboard">{t("empty.action")}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadDashboard()}
                className="cursor-pointer"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("filters.actions.refresh")}
              </Button>
            </CardContent>
          ) : null}
        </Card>
      )}
    </div>
  )
}
