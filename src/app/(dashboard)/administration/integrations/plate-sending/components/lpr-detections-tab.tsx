"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Pencil, RefreshCcw, Search, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { parseISO } from "date-fns"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useHasPermission } from "@/hooks/use-has-permission"
import { cameraService } from "@/services/camera.service"
import { lprDetectionService } from "@/services/lpr-detection.service"
import { Camera } from "@/types/camera"
import { LprDetection } from "@/types/lpr-detection"
import { LprCleanupDialog } from "./lpr-cleanup-dialog"
import { LprDetectionFormDialog } from "./lpr-detection-form-dialog"

function formatDirection(direction: string | null | undefined, t: ReturnType<typeof useTranslator>) {
  const normalized = direction?.trim().toLowerCase()
  if (normalized === "obverse" || normalized === "forward") return t("lpr.directions.obverse")
  if (normalized === "reverse" || normalized === "backward") return t("lpr.directions.reverse")
  return direction || "—"
}

export function LprDetectionsTab() {
  const t = useTranslator("plate_sending")
  const currentLocale = t.getLocale()
  const { hasPermission } = useHasPermission()

  const canRead = hasPermission("visualizar_integracao")
  const canManage = hasPermission("configurar_integracao")

  const [detections, setDetections] = useState<LprDetection[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [plateFilter, setPlateFilter] = useState("")
  const [plateSearchMode, setPlateSearchMode] = useState("smart")
  const [cameraFilter, setCameraFilter] = useState("all")
  const [directionFilter, setDirectionFilter] = useState("all")
  const [minConfidenceFilter, setMinConfidenceFilter] = useState("")
  const [maxConfidenceFilter, setMaxConfidenceFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [appliedFilters, setAppliedFilters] = useState({
    plateText: "",
    plateSearchMode: "smart",
    cameraId: "all",
    direction: "all",
    minConfidence: "",
    maxConfidence: "",
    startDate: "",
    endDate: "",
  })

  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)

  const [editingDetection, setEditingDetection] = useState<LprDetection | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [deletingDetection, setDeletingDetection] = useState<LprDetection | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isCleanupOpen, setIsCleanupOpen] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const loadCameras = useCallback(async () => {
    setIsLoadingCameras(true)
    try {
      const response = await cameraService.findAll({ page: 1, limit: 500 })
      setCameras(response.data || [])
    } catch (error) {
      setCameras([])
      toast.apiError(error, t("lpr.notifications.load_cameras_error"))
    } finally {
      setIsLoadingCameras(false)
    }
  }, [t])

  const loadDetections = useCallback(async () => {
    if (!canRead) {
      setDetections([])
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await lprDetectionService.findAll({
        page,
        limit: pageSize,
        plateText: appliedFilters.plateText || undefined,
        plateSearchMode:
          appliedFilters.plateText && appliedFilters.plateSearchMode !== "smart"
            ? (appliedFilters.plateSearchMode as "exact" | "contains" | "pattern")
            : appliedFilters.plateText
              ? "smart"
              : undefined,
        cameraId:
          appliedFilters.cameraId !== "all" ? Number(appliedFilters.cameraId) : undefined,
        direction:
          appliedFilters.direction !== "all" ? appliedFilters.direction : undefined,
        minConfidence:
          appliedFilters.minConfidence.trim() !== ""
            ? Number(appliedFilters.minConfidence)
            : undefined,
        maxConfidence:
          appliedFilters.maxConfidence.trim() !== ""
            ? Number(appliedFilters.maxConfidence)
            : undefined,
        startDate: appliedFilters.startDate
          ? new Date(appliedFilters.startDate).toISOString()
          : undefined,
        endDate: appliedFilters.endDate ? new Date(appliedFilters.endDate).toISOString() : undefined,
      })

      setDetections(response.data || [])
      setTotal(response.meta?.itemCount || 0)
    } catch (error) {
      setDetections([])
      setTotal(0)
      toast.apiError(error, t("lpr.notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters.cameraId, appliedFilters.direction, appliedFilters.endDate, appliedFilters.maxConfidence, appliedFilters.minConfidence, appliedFilters.plateSearchMode, appliedFilters.plateText, appliedFilters.startDate, canRead, page, pageSize, t])

  useEffect(() => {
    void loadDetections()
  }, [loadDetections])

  useEffect(() => {
    void loadCameras()
  }, [loadCameras])

  const cameraOptions = useMemo(
    () =>
      cameras
        .slice()
        .sort((left, right) =>
          (left.nome || `#${left.id}`).localeCompare(right.nome || `#${right.id}`),
        ),
    [cameras],
  )

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({
      plateText: plateFilter.trim(),
      plateSearchMode,
      cameraId: cameraFilter,
      direction: directionFilter,
      minConfidence: minConfidenceFilter.trim(),
      maxConfidence: maxConfidenceFilter.trim(),
      startDate,
      endDate,
    })
  }

  const resetFilters = () => {
    setPlateFilter("")
    setPlateSearchMode("smart")
    setCameraFilter("all")
    setDirectionFilter("all")
    setMinConfidenceFilter("")
    setMaxConfidenceFilter("")
    setStartDate("")
    setEndDate("")
    setPage(1)
    setAppliedFilters({
      plateText: "",
      plateSearchMode: "smart",
      cameraId: "all",
      direction: "all",
      minConfidence: "",
      maxConfidence: "",
      startDate: "",
      endDate: "",
    })
  }

  const handleSave = async (values: { plateText: string; confidence?: number }) => {
    if (!editingDetection) return
    if (!values.plateText.trim()) {
      toast.error(t("lpr.notifications.validation_error"))
      return
    }

    setIsSaving(true)
    try {
      await lprDetectionService.update(editingDetection.id, values)
      toast.success(t("lpr.notifications.update_success"))
      setIsEditOpen(false)
      await loadDetections()
    } catch (error) {
      toast.apiError(error, t("lpr.notifications.update_error"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingDetection) return

    setIsDeleting(true)
    try {
      await lprDetectionService.delete(deletingDetection.id)
      toast.success(t("lpr.notifications.delete_success"))
      setDeletingDetection(null)
      await loadDetections()
    } catch (error) {
      toast.apiError(error, t("lpr.notifications.delete_error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCleanup = async (values: { olderThan?: string; quantity?: number }) => {
    if (!values.olderThan && !values.quantity) {
      toast.error(t("lpr.notifications.cleanup_validation_error"))
      return
    }

    setIsCleaningUp(true)
    try {
      const response = await lprDetectionService.deleteBatch({
        olderThan: values.olderThan ? new Date(values.olderThan).toISOString() : undefined,
        quantity: values.quantity,
      })
      toast.success(t("lpr.notifications.cleanup_success", { count: response.count }))
      setIsCleanupOpen(false)
      await loadDetections()
    } catch (error) {
      toast.apiError(error, t("lpr.notifications.cleanup_error"))
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (!canRead) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">{t("lpr.no_access")}</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-lg border bg-card p-4 xl:grid-cols-[1.4fr_0.9fr_1fr_0.9fr_0.9fr_1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="lpr-plate-filter">{t("lpr.filters.plate")}</Label>
          <Input
            id="lpr-plate-filter"
            value={plateFilter}
            onChange={(event) => setPlateFilter(event.target.value.toUpperCase())}
            placeholder={t("lpr.filters.placeholders.plate")}
          />
          <p className="text-xs text-muted-foreground">
            {t("lpr.filters.plate_hint")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("lpr.filters.plate_search_mode")}</Label>
          <Select value={plateSearchMode} onValueChange={setPlateSearchMode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("lpr.filters.placeholders.plate_search_mode")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smart">{t("lpr.filters.search_modes.smart")}</SelectItem>
              <SelectItem value="exact">{t("lpr.filters.search_modes.exact")}</SelectItem>
              <SelectItem value="contains">{t("lpr.filters.search_modes.contains")}</SelectItem>
              <SelectItem value="pattern">{t("lpr.filters.search_modes.pattern")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("lpr.filters.camera")}</Label>
          <Select value={cameraFilter} onValueChange={setCameraFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("lpr.filters.placeholders.camera")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("lpr.filters.all_cameras")}</SelectItem>
              {cameraOptions.map((camera) => (
                <SelectItem key={camera.id} value={String(camera.id)}>
                  {camera.nome || t("lpr.camera_fallback", { id: camera.id })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("lpr.filters.direction")}</Label>
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("lpr.filters.placeholders.direction")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("lpr.filters.all_directions")}</SelectItem>
              <SelectItem value="forward">{t("lpr.directions.obverse")}</SelectItem>
              <SelectItem value="reverse">{t("lpr.directions.reverse")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lpr-min-confidence">{t("lpr.filters.min_confidence")}</Label>
          <Input
            id="lpr-min-confidence"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={minConfidenceFilter}
            onChange={(event) => setMinConfidenceFilter(event.target.value)}
            placeholder={t("lpr.filters.placeholders.min_confidence")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lpr-max-confidence">{t("lpr.filters.max_confidence")}</Label>
          <Input
            id="lpr-max-confidence"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={maxConfidenceFilter}
            onChange={(event) => setMaxConfidenceFilter(event.target.value)}
            placeholder={t("lpr.filters.placeholders.max_confidence")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lpr-start-date">{t("lpr.filters.start_date")}</Label>
          <Input
            id="lpr-start-date"
            type="datetime-local"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lpr-end-date">{t("lpr.filters.end_date")}</Label>
          <Input
            id="lpr-end-date"
            type="datetime-local"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-end justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetFilters}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("lpr.actions.reset")}
          </Button>
          <Button type="button" onClick={applyFilters}>
            <Search className="mr-2 h-4 w-4" />
            {t("lpr.actions.search")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {isLoadingCameras ? t("lpr.loading_cameras") : t("lpr.list_description")}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={() => void loadDetections()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("actions.reload")}
          </Button>
          {canManage ? (
            <Button variant="destructive" onClick={() => setIsCleanupOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("lpr.actions.cleanup")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("lpr.table.columns.id")}</TableHead>
              <TableHead>{t("lpr.table.columns.plate")}</TableHead>
              <TableHead>{t("lpr.table.columns.detected_at")}</TableHead>
              <TableHead>{t("lpr.table.columns.camera")}</TableHead>
              <TableHead>{t("lpr.table.columns.direction")}</TableHead>
              <TableHead>{t("lpr.table.columns.confidence")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("lpr.table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detections.length > 0 ? (
              detections.map((detection) => (
                <TableRow key={detection.id}>
                  <TableCell>{detection.id}</TableCell>
                  <TableCell className="font-medium">{detection.plateText}</TableCell>
                  <TableCell>
                    {formatLocalizedDateTime(parseISO(detection.detectedAt), currentLocale)}
                  </TableCell>
                  <TableCell>
                    {detection.camera?.nome || t("lpr.camera_fallback", { id: detection.cameraId })}
                  </TableCell>
                  <TableCell>{formatDirection(detection.direction, t)}</TableCell>
                  <TableCell>
                    {typeof detection.confidence === "number"
                      ? `${detection.confidence.toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{t("lpr.table.open_actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingDetection(detection)
                              setIsEditOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("lpr.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setDeletingDetection(detection)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("lpr.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {isLoading ? t("loading") : t("lpr.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <LprDetectionFormDialog
        detection={editingDetection}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleSave}
        isSubmitting={isSaving}
      />

      <LprCleanupDialog
        open={isCleanupOpen}
        onOpenChange={setIsCleanupOpen}
        onSubmit={handleCleanup}
        isSubmitting={isCleaningUp}
      />

      <ConfirmDialog
        isOpen={!!deletingDetection}
        onOpenChange={(open) => {
          if (!open) setDeletingDetection(null)
        }}
        title={t("lpr.delete_dialog.title")}
        description={t("lpr.delete_dialog.description", {
          plate: deletingDetection?.plateText || "",
        })}
        confirmText={t("lpr.delete_dialog.confirm")}
        cancelText={t("lpr.delete_dialog.cancel")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
