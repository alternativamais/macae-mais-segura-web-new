"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { mapService } from "@/services/map.service"
import { OperationalMapPoint } from "@/types/map"
import { MapDataManagerPanel } from "./components/map-data-manager-panel"
import { OperationalMapCanvas } from "./components/operational-map-canvas"
import { PointPreviewDialog } from "./components/point-preview-dialog"
import {
  countPointCameras,
  countPointClimateEquipments,
  countPointSmartSwitches,
  countTotalPointAssets,
  matchesMapSearch,
  normalizePointMarkers,
} from "./components/utils"

type StatusFilter = "all" | "active" | "inactive"
type TotemFilter = "all" | "with_totem" | "without_totem"
type AssetFilter = "all" | "camera" | "smart_switch" | "climate" | "empty"
type SortFilter = "assets_desc" | "name_asc" | "reference_asc"

export default function OperationalMapPage() {
  const t = useTranslator("operational_map")
  const [managerOpen, setManagerOpen] = useState(() => {
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [totemFilter, setTotemFilter] = useState<TotemFilter>("all")
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all")
  const [sortFilter, setSortFilter] = useState<SortFilter>("assets_desc")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const markers = useMemo(() => normalizePointMarkers(points), [points])

  const filteredMarkers = useMemo(() => {
    const visible = markers.filter((marker) => {
      const point = marker.point
      const companyMatches =
        companyFilter === "all" || String(point.empresa?.id ?? "") === companyFilter
      const statusMatches =
        statusFilter === "all" ||
        (statusFilter === "active" && point.status !== "inactive") ||
        (statusFilter === "inactive" && point.status === "inactive")
      const totemMatches =
        totemFilter === "all" ||
        (totemFilter === "with_totem" && Boolean(point.totem?.id)) ||
        (totemFilter === "without_totem" && !point.totem?.id)
      const totalCameras = countPointCameras(point)
      const totalSwitches = countPointSmartSwitches(point)
      const totalClimate = countPointClimateEquipments(point)
      const totalAssets = totalCameras + totalSwitches + totalClimate
      const assetMatches =
        assetFilter === "all" ||
        (assetFilter === "camera" && totalCameras > 0) ||
        (assetFilter === "smart_switch" && totalSwitches > 0) ||
        (assetFilter === "climate" && totalClimate > 0) ||
        (assetFilter === "empty" && totalAssets === 0)

      return (
        companyMatches &&
        statusMatches &&
        totemMatches &&
        assetMatches &&
        matchesMapSearch(marker, searchQuery)
      )
    })

    return [...visible].sort((left, right) => {
      if (sortFilter === "name_asc") {
        return left.point.nome.localeCompare(right.point.nome)
      }

      if (sortFilter === "reference_asc") {
        return (left.point.pontoDeReferencia || left.point.nome).localeCompare(
          right.point.pontoDeReferencia || right.point.nome,
        )
      }

      const assetsDelta =
        countTotalPointAssets(right.point) - countTotalPointAssets(left.point)

      if (assetsDelta !== 0) {
        return assetsDelta
      }

      return left.point.nome.localeCompare(right.point.nome)
    })
  }, [markers, companyFilter, statusFilter, totemFilter, assetFilter, searchQuery, sortFilter])

  const selectedMarker = useMemo(
    () => filteredMarkers.find((marker) => marker.id === selectedMarkerId)
      ?? markers.find((marker) => marker.id === selectedMarkerId)
      ?? null,
    [filteredMarkers, markers, selectedMarkerId],
  )

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
    const availableCompanyIds = new Set(
      markers
        .map((marker) => marker.point.empresa?.id)
        .filter((value): value is number => typeof value === "number"),
    )

    if (companyFilter !== "all" && !availableCompanyIds.has(Number(companyFilter))) {
      setCompanyFilter("all")
    }
  }, [companyFilter, markers])

  useEffect(() => {
    if (selectedMarkerId && filteredMarkers.some((marker) => marker.id === selectedMarkerId)) {
      return
    }

    setSelectedMarkerId(filteredMarkers[0]?.id ?? markers[0]?.id ?? null)
  }, [filteredMarkers, markers, selectedMarkerId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const syncManagerState = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches
      setManagerOpen(matches)
    }

    syncManagerState()

    mediaQuery.addEventListener("change", syncManagerState)
    return () => mediaQuery.removeEventListener("change", syncManagerState)
  }, [])

  const handleFocusMarker = (markerId: number) => {
    setSelectedMarkerId(markerId)
  }

  const handleOpenPreview = (markerId: number) => {
    setSelectedMarkerId(markerId)
    setPreviewOpen(true)
  }

  return (
    <ScreenGuard screenKey="admin.map">
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative h-full min-h-0 overflow-hidden bg-background">
          <MapDataManagerPanel
            open={managerOpen}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            totemFilter={totemFilter}
            assetFilter={assetFilter}
            sortFilter={sortFilter}
            companyFilter={companyFilter}
            showPoints={showPoints}
            isLoading={isLoading}
            error={error}
            allMarkers={markers}
            totalMarkers={markers.length}
            filteredMarkers={filteredMarkers}
            onToggleOpen={() => setManagerOpen((current) => !current)}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onTotemFilterChange={setTotemFilter}
            onAssetFilterChange={setAssetFilter}
            onSortFilterChange={setSortFilter}
            onCompanyFilterChange={setCompanyFilter}
            onShowPointsChange={setShowPoints}
            onRefresh={() => void loadPoints()}
          />

          <OperationalMapCanvas
            markers={filteredMarkers}
            selectedMarkerId={selectedMarkerId}
            showPoints={showPoints}
            onSelectMarker={handleOpenPreview}
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
