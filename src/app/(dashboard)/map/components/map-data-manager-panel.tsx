"use client"

import { useMemo } from "react"
import {
  ChevronLeft,
  Radar,
  RefreshCcw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useTranslator } from "@/lib/i18n"
import { OperationalMapMarker, OperationalMapPoint } from "@/types/map"
import {
  countTotalPointAssets,
  getPointCompanyName,
} from "./utils"

type StatusFilter = "all" | "active" | "inactive"
type TotemFilter = "all" | "with_totem" | "without_totem"
type AssetFilter = "all" | "camera" | "smart_switch" | "climate" | "empty"
type SortFilter = "assets_desc" | "name_asc" | "reference_asc"

interface MapDataManagerPanelProps {
  open: boolean
  searchQuery: string
  statusFilter: StatusFilter
  totemFilter: TotemFilter
  assetFilter: AssetFilter
  sortFilter: SortFilter
  companyFilter: string
  showPoints: boolean
  isLoading: boolean
  error?: string
  allMarkers: OperationalMapMarker[]
  totalMarkers: number
  filteredMarkers: OperationalMapMarker[]
  onToggleOpen: () => void
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onTotemFilterChange: (value: TotemFilter) => void
  onAssetFilterChange: (value: AssetFilter) => void
  onSortFilterChange: (value: SortFilter) => void
  onCompanyFilterChange: (value: string) => void
  onShowPointsChange: (value: boolean) => void
  onRefresh: () => void
}

export function MapDataManagerPanel({
  open,
  searchQuery,
  statusFilter,
  totemFilter,
  assetFilter,
  sortFilter,
  companyFilter,
  showPoints,
  isLoading,
  error,
  allMarkers,
  totalMarkers,
  filteredMarkers,
  onToggleOpen,
  onSearchChange,
  onStatusFilterChange,
  onTotemFilterChange,
  onAssetFilterChange,
  onSortFilterChange,
  onCompanyFilterChange,
  onShowPointsChange,
  onRefresh,
}: MapDataManagerPanelProps) {
  const t = useTranslator("operational_map")
  const notInformed = t("not_informed")

  const companyOptions = useMemo(() => {
    const map = new Map<number, string>()

    allMarkers.forEach((marker) => {
      const companyId = marker.point.empresa?.id
      if (typeof companyId === "number") {
        map.set(companyId, getPointCompanyName(marker.point, notInformed))
      }
    })

    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [allMarkers, notInformed])

  const pointsWithTotem = filteredMarkers.filter((marker) => marker.point.totem?.id).length
  const totalAssets = filteredMarkers.reduce(
    (sum, marker) => sum + countTotalPointAssets(marker.point),
    0,
  )
  const visibleCompanies = new Set(
    filteredMarkers
      .map((marker) => marker.point.empresa?.id)
      .filter((value): value is number => typeof value === "number"),
  ).size
  const busiestPoint = filteredMarkers.reduce<OperationalMapPoint | null>((current, marker) => {
    if (!current) {
      return marker.point
    }

    return countTotalPointAssets(marker.point) > countTotalPointAssets(current)
      ? marker.point
      : current
  }, null)

  return (
    <>
      {!open ? (
        <div className="absolute top-[calc(var(--header-height)+1rem)] left-4 z-20 rounded-xl border border-zinc-800 bg-zinc-950 px-1.5 py-1.5 shadow-lg">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white"
            onClick={onToggleOpen}
          >
            <Radar className="mr-2 h-4 w-4" />
            {t("manager.open")}
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute top-[calc(var(--header-height)+1rem)] right-4 left-4 z-20 w-[420px] max-w-[calc(100%-2rem)] transition-transform duration-200 md:right-auto",
          open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        )}
      >
        <div className="max-h-[calc(100dvh-var(--header-height)-2rem)] overflow-hidden rounded-xl border bg-background shadow-lg md:max-h-none">
          <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("manager.title")}</p>
              <p className="text-xs text-muted-foreground">{t("manager.description")}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 cursor-pointer"
              onClick={onToggleOpen}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-4 md:overflow-visible">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-muted/20 px-3 py-3">
                <p className="text-[11px] text-muted-foreground">{t("manager.summary.points")}</p>
                <p className="mt-1 text-lg font-semibold">{filteredMarkers.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 px-3 py-3">
                <p className="text-[11px] text-muted-foreground">{t("manager.summary.with_totem")}</p>
                <p className="mt-1 text-lg font-semibold">{pointsWithTotem}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 px-3 py-3">
                <p className="text-[11px] text-muted-foreground">{t("manager.summary.assets")}</p>
                <p className="mt-1 text-lg font-semibold">{totalAssets}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 px-3 py-3">
                <p className="text-[11px] text-muted-foreground">{t("manager.summary.companies")}</p>
                <p className="mt-1 text-lg font-semibold">{visibleCompanies}</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("manager.search_placeholder")}
                className="pl-9"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("manager.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("manager.options.all_status")}</SelectItem>
                  <SelectItem value="active">{t("manager.options.active")}</SelectItem>
                  <SelectItem value="inactive">{t("manager.options.inactive")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={totemFilter} onValueChange={(value) => onTotemFilterChange(value as TotemFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("manager.filters.totem")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("manager.options.all_totem")}</SelectItem>
                  <SelectItem value="with_totem">{t("manager.options.with_totem")}</SelectItem>
                  <SelectItem value="without_totem">{t("manager.options.without_totem")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assetFilter} onValueChange={(value) => onAssetFilterChange(value as AssetFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("manager.filters.assets")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("manager.options.all_assets")}</SelectItem>
                  <SelectItem value="camera">{t("manager.options.camera")}</SelectItem>
                  <SelectItem value="smart_switch">{t("manager.options.smart_switch")}</SelectItem>
                  <SelectItem value="climate">{t("manager.options.climate")}</SelectItem>
                  <SelectItem value="empty">{t("manager.options.empty_assets")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortFilter} onValueChange={(value) => onSortFilterChange(value as SortFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("manager.filters.sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets_desc">{t("manager.options.sort_assets")}</SelectItem>
                  <SelectItem value="name_asc">{t("manager.options.sort_name")}</SelectItem>
                  <SelectItem value="reference_asc">{t("manager.options.sort_reference")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {companyOptions.length > 1 ? (
              <Select value={companyFilter} onValueChange={onCompanyFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("manager.filters.company")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("manager.options.all_companies")}</SelectItem>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{t("manager.show_points")}</p>
                <p className="text-xs text-muted-foreground">{t("manager.show_points_desc")}</p>
              </div>
              <Switch checked={showPoints} onCheckedChange={onShowPointsChange} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {t("manager.results", { visible: filteredMarkers.length, total: totalMarkers })}
                </Badge>
                <Badge variant="outline">
                  {t("manager.assets_count", { count: totalAssets })}
                </Badge>
                <Badge variant="outline">
                  {t("manager.companies_count", { count: visibleCompanies })}
                </Badge>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 cursor-pointer px-2"
                onClick={onRefresh}
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                {t("actions.refresh")}
              </Button>
            </div>

            {error && !isLoading ? (
              <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {error}
              </div>
            ) : null}
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-sm font-semibold">{t("manager.focus_title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {busiestPoint
                  ? t("manager.focus_desc", {
                      point: busiestPoint.nome,
                      count: countTotalPointAssets(busiestPoint),
                    })
                  : t("manager.focus_empty")}
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-lg border-2 border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            ) : filteredMarkers.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                {t("empty_points")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
