"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTag } from "@/components/shared/data-tag"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useTranslator } from "@/lib/i18n"
import { dashboardWidgetService } from "@/services/dashboard-widget.service"
import { DashboardWidget } from "@/types/dashboard-widget"
import { Camera } from "@/types/camera"
import { DashboardWidgetDetailsDialog } from "./dashboard-widget-details-dialog"
import { DashboardWidgetFormDialog } from "./dashboard-widget-form-dialog"

interface DashboardWidgetsTabProps {
  widgets: DashboardWidget[]
  cameras: Camera[]
  isLoading: boolean
  onReload: () => void | Promise<void>
}

export function DashboardWidgetsTab({
  widgets,
  cameras,
  isLoading,
  onReload,
}: DashboardWidgetsTabProps) {
  const t = useTranslator("dashboard_management.table")
  const { isAllCompanies } = useCompanyVisibility()

  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsWidget, setDetailsWidget] = useState<DashboardWidget | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [widgetToDelete, setWidgetToDelete] = useState<DashboardWidget | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return
    const timeout = window.setTimeout(() => setDetailsWidget(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return
    const timeout = window.setTimeout(() => setEditingWidget(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return
    const timeout = window.setTimeout(() => setWidgetToDelete(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredWidgets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return widgets

    return widgets.filter((widget) => {
      const cameraNames = (widget.config?.cameraIds ?? [])
        .map((cameraId) => cameras.find((camera) => camera.id === cameraId)?.nome || "")
        .join(" ")

      return [
        widget.title,
        widget.empresa?.nome,
        cameraNames,
        widget.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [cameras, searchTerm, widgets])

  const paginatedWidgets = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredWidgets.slice(startIndex, startIndex + pageSize)
  }, [filteredWidgets, page, pageSize])

  const handleDelete = async () => {
    if (!widgetToDelete) return

    setIsDeleting(true)

    try {
      await dashboardWidgetService.delete(widgetToDelete.id)
      toast.success(t("delete_dialog.success"))
      await onReload()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("delete_dialog.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("actions.search_placeholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => {
            setEditingWidget(null)
            setIsFormOpen(true)
          }}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("actions.create")}
        </Button>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.widget")}</TableHead>
              {isAllCompanies ? <TableHead>{t("columns.company")}</TableHead> : null}
              <TableHead>{t("columns.scope")}</TableHead>
              <TableHead>{t("columns.layout")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWidgets.length > 0 ? (
              paginatedWidgets.map((widget) => {
                const selectedCameraCount = widget.config?.cameraIds?.length ?? 0

                return (
                  <TableRow key={widget.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{widget.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("type_lpr_vehicle_count")}
                        </div>
                      </div>
                    </TableCell>
                    {isAllCompanies ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {widget.empresa?.nome || "-"}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {selectedCameraCount > 0
                            ? t("scope_selected_cameras", { count: selectedCameraCount })
                            : t("scope_all_cameras")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(`periods.${widget.config?.period || "7d"}`)} •{" "}
                          {t(`granularities.${widget.config?.granularity || "day"}`)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DataTag tone={widget.size === "full" ? "info" : "neutral"}>
                        {widget.size === "full" ? t("sizes.full") : t("sizes.half")}
                      </DataTag>
                    </TableCell>
                    <TableCell>
                      <DataTag tone={widget.enabled ? "success" : "neutral"}>
                        {widget.enabled ? t("status.enabled") : t("status.disabled")}
                      </DataTag>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{t("open_actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailsWidget(widget)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("actions.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingWidget(widget)
                              setIsFormOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setWidgetToDelete(widget)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAllCompanies ? 6 : 5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isLoading ? t("loading") : t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        total={filteredWidgets.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <DashboardWidgetDetailsDialog
        widget={detailsWidget}
        cameras={cameras}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <DashboardWidgetFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={onReload}
        widget={editingWidget}
        cameras={cameras}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("delete_dialog.title")}
        description={t("delete_dialog.description")}
        confirmText={t("actions.delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
