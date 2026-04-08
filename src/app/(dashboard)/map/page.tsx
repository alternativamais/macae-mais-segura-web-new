"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Camera,
  ChevronLeft,
  Cpu,
  ListFilter,
  Loader2,
  MapPinned,
  Radar,
  RefreshCcw,
  Search,
  Thermometer,
} from "lucide-react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { SummaryStatTile } from "@/components/shared/summary-stat-cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { mapService } from "@/services/map.service"
import { OperationalMapPoint } from "@/types/map"
import { OperationalMapCanvas } from "./components/operational-map-canvas"
import { PointPreviewDialog } from "./components/point-preview-dialog"
import {
  buildOperationalMapSummary,
  countPointClimateEquipments,
  countPointCameras,
  countPointSmartSwitches,
  countTotalPointAssets,
  getPointReference,
  matchesMapSearch,
  normalizePointMarkers,
} from "./components/utils"

export default function OperationalMapPage() {
  const t = useTranslator("operational_map")
  const [filtersOpen, setFiltersOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true
    }

    return window.innerWidth >= 768
  })

  const [points, setPoints] = useState<OperationalMapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showPoints, setShowPoints] = useState(true)
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const markers = useMemo(() => normalizePointMarkers(points), [points])
  const filteredMarkers = useMemo(
    () => markers.filter((marker) => matchesMapSearch(marker, searchQuery)),
    [markers, searchQuery],
  )
  const selectedMarker = useMemo(
    () => markers.find((marker) => marker.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId],
  )
  const filteredSummary = useMemo(
    () => buildOperationalMapSummary(filteredMarkers),
    [filteredMarkers],
  )
  const fullSummary = useMemo(() => buildOperationalMapSummary(markers), [markers])

  const loadPoints = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await mapService.findPoints()
      setPoints(response)
    } catch (loadError) {
      setPoints([])
      setError(t("errors.load_points"))
      toast.apiError(loadError, t("errors.load_points"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadPoints()
  }, [loadPoints])

  useEffect(() => {
    if (selectedMarkerId && markers.some((marker) => marker.id === selectedMarkerId)) {
      return
    }

    setSelectedMarkerId(markers[0]?.id ?? null)
  }, [markers, selectedMarkerId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const syncFiltersState = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches
      setFiltersOpen(matches)
    }

    syncFiltersState()

    mediaQuery.addEventListener("change", syncFiltersState)
    return () => mediaQuery.removeEventListener("change", syncFiltersState)
  }, [])

  const handleMarkerSelect = (markerId: number) => {
    setSelectedMarkerId(markerId)
    setPreviewOpen(true)
  }

  return (
    <ScreenGuard screenKey="admin.map">
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative h-full min-h-0 overflow-hidden bg-background">
          {!filtersOpen ? (
            <div className="absolute top-[calc(var(--header-height)+1rem)] left-4 z-20 rounded-xl border border-zinc-800 bg-zinc-950 px-1.5 py-1.5 shadow-lg">
              <div className="flex items-center gap-1">
                {!filtersOpen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <ListFilter className="mr-2 h-4 w-4" />
                    {t("sidebar.open_filters")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            className={`absolute top-[calc(var(--header-height)+1rem)] right-4 bottom-4 left-4 z-20 w-[360px] max-w-[calc(100%-2rem)] transition-transform duration-200 md:right-auto ${
              filtersOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
            }`}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t("sidebar.points_title")}</p>
                  <p className="text-xs text-muted-foreground">{t("sidebar.results", { count: filteredMarkers.length })}</p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 cursor-pointer"
                  onClick={() => setFiltersOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 border-b px-4 py-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("sidebar.search_placeholder")}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{t("sidebar.show_points")}</p>
                    <p className="text-xs text-muted-foreground">{t("sidebar.show_points_desc")}</p>
                  </div>
                  <Switch checked={showPoints} onCheckedChange={setShowPoints} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("sidebar.scope_results", {
                      visible: filteredSummary.totalPoints,
                      total: fullSummary.totalPoints,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 cursor-pointer px-2"
                    onClick={() => void loadPoints()}
                  >
                    <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                    {t("actions.refresh")}
                  </Button>
                </div>

                {error && !isLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <MapPinned className="h-4 w-4" />
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="space-y-4 p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-4 py-10 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("loading")}
                      </span>
                    </div>
                  ) : filteredMarkers.length > 0 ? (
                    <>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{t("sidebar.overview_title")}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("sidebar.overview_desc")}
                            </p>
                          </div>
                          <Radar className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <SummaryStatTile
                            title={t("sidebar.kpis.points_scope")}
                            value={filteredSummary.totalPoints}
                            description={t("sidebar.kpis.points_scope_desc")}
                          />
                          <SummaryStatTile
                            title={t("sidebar.kpis.total_assets")}
                            value={filteredSummary.totalAssets}
                            description={t("sidebar.kpis.total_assets_desc")}
                          />
                          <SummaryStatTile
                            title={t("sidebar.kpis.active_points")}
                            value={filteredSummary.activePoints}
                            description={t("sidebar.kpis.active_points_desc", {
                              value: Math.round(filteredSummary.activeCoverage),
                            })}
                          />
                          <SummaryStatTile
                            title={t("sidebar.kpis.totem_coverage")}
                            value={`${Math.round(filteredSummary.totemCoverage)}%`}
                            description={t("sidebar.kpis.totem_coverage_desc")}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{t("sidebar.assets_title")}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("sidebar.assets_desc")}
                            </p>
                          </div>
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <SummaryStatTile
                            title={t("sidebar.assets.cameras")}
                            value={filteredSummary.totalCameras}
                            icon={Camera}
                          />
                          <SummaryStatTile
                            title={t("sidebar.assets.switches")}
                            value={filteredSummary.totalSmartSwitches}
                            icon={Activity}
                          />
                          <SummaryStatTile
                            title={t("sidebar.assets.climate")}
                            value={filteredSummary.totalClimateEquipments}
                            icon={Thermometer}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-sm font-semibold">{t("sidebar.distribution_title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("sidebar.distribution_desc")}
                        </p>

                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                              <span className="text-muted-foreground">
                                {t("sidebar.distribution.active_points")}
                              </span>
                              <span className="font-medium">
                                {filteredSummary.activePoints}/{filteredSummary.totalPoints}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-background">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${filteredSummary.activeCoverage}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                              <span className="text-muted-foreground">
                                {t("sidebar.distribution.with_totem")}
                              </span>
                              <span className="font-medium">
                                {filteredSummary.pointsWithTotem}/{filteredSummary.totalPoints}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-background">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${filteredSummary.totemCoverage}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border bg-background px-2.5 py-2">
                              <p className="text-[11px] text-muted-foreground">
                                {t("sidebar.distribution.without_totem")}
                              </p>
                              <p className="text-sm font-semibold">
                                {filteredSummary.pointsWithoutTotem}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background px-2.5 py-2">
                              <p className="text-[11px] text-muted-foreground">
                                {t("sidebar.distribution.inactive_points")}
                              </p>
                              <p className="text-sm font-semibold">
                                {filteredSummary.inactivePoints}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-sm font-semibold">{t("sidebar.insights_title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("sidebar.insights_desc")}
                        </p>

                        <div className="mt-3 space-y-2">
                          <div className="rounded-md border bg-background px-3 py-2">
                            <p className="text-[11px] text-muted-foreground">
                              {t("sidebar.insights.average_assets")}
                            </p>
                            <p className="text-sm font-semibold">
                              {filteredSummary.averageAssetsPerPoint.toFixed(1)}
                            </p>
                          </div>

                          <div className="rounded-md border bg-background px-3 py-2">
                            <p className="text-[11px] text-muted-foreground">
                              {t("sidebar.insights.most_equipped")}
                            </p>
                            <p className="truncate text-sm font-semibold">
                              {filteredSummary.busiestPoint?.nome || t("not_informed")}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {filteredSummary.busiestPoint
                                ? t("sidebar.insights.most_equipped_desc", {
                                    count: countTotalPointAssets(filteredSummary.busiestPoint),
                                    value: getPointReference(
                                      filteredSummary.busiestPoint,
                                      t("not_informed"),
                                    ),
                                  })
                                : t("sidebar.insights.no_peak")}
                            </p>
                          </div>

                          <div className="rounded-md border bg-background px-3 py-2">
                            <p className="text-[11px] text-muted-foreground">
                              {t("sidebar.insights.search_context")}
                            </p>
                            <p className="text-sm font-semibold">
                              {t("sidebar.insights.search_context_value", {
                                visible: filteredSummary.totalPoints,
                                total: fullSummary.totalPoints,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                      {t("empty_points")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <OperationalMapCanvas
            markers={filteredMarkers}
            selectedMarkerId={selectedMarkerId}
            showPoints={showPoints}
            onSelectMarker={handleMarkerSelect}
          />
        </div>
      </div>

      <PointPreviewDialog
        open={previewOpen}
        marker={selectedMarker}
        onOpenChange={setPreviewOpen}
      />
    </ScreenGuard>
  )
}
