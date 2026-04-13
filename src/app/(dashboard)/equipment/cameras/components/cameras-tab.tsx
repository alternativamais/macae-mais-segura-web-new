"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
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
import { useHasPermission } from "@/hooks/use-has-permission"
import { cameraService } from "@/services/camera.service"
import { Camera } from "@/types/camera"
import { CameraDetailsDialog } from "./camera-details-dialog"
import { CameraFormDialog } from "./camera-form-dialog"
import { CameraStatusBadge } from "./status-badges"
import { StatCards } from "./stat-cards"
import { getCameraCompanyName, getCameraLocationLabel } from "./utils"

const FETCH_PAGE_SIZE = 100

export function CamerasTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("cameras")
  const currentLocale = t.getLocale()
  const { isAllCompanies, companiesById } = useCompanyVisibility()

  const canCreate = hasPermission("criar_camera")
  const canUpdate = hasPermission("atualizar_camera")
  const canDelete = hasPermission("deletar_camera")

  const [items, setItems] = useState<Camera[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsItem, setDetailsItem] = useState<Camera | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const pointLabel = t("location.point")
  const totemLabel = t("location.totem")
  const notInformed = t("shared.not_informed")
  const noBrand = t("table.no_brand")
  const noUser = t("table.no_user")
  const loadErrorMessage = t("table.notifications.load_error")
  const deleteSuccessMessage = t("table.delete_dialog.success")
  const deleteErrorMessage = t("table.delete_dialog.error")

  const locationLabels = useMemo(
    () => ({
      point: pointLabel,
      totem: totemLabel,
      fallback: notInformed,
    }),
    [notInformed, pointLabel, totemLabel]
  )

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true)

    try {
      const data = await cameraService.getStats()
      setStats(data)
    } catch (error) {
      toast.apiError(error, loadErrorMessage)
      setStats(null)
    } finally {
      setIsLoadingStats(false)
    }
  }, [loadErrorMessage])

  const loadItems = useCallback(async () => {
    setIsLoading(true)

    try {
      const firstPage = await cameraService.findAll({
        page: 1,
        limit: FETCH_PAGE_SIZE,
      })

      const totalPages = Math.max(1, Math.ceil(firstPage.total / FETCH_PAGE_SIZE))
      const remaining =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                cameraService.findAll({
                  page: index + 2,
                  limit: FETCH_PAGE_SIZE,
                })
              )
            )
          : []

      setItems([...firstPage.data, ...remaining.flatMap((response) => response.data)])
    } catch (error) {
      toast.apiError(error, loadErrorMessage)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [loadErrorMessage])

  useEffect(() => {
    loadItems()
    loadStats()
  }, [loadItems, loadStats])

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return

    const timeout = window.setTimeout(() => {
      setEditingCamera(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setCameraToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return items

    return items.filter((item) =>
      [
        item.nome,
        item.marca,
        item.ip,
        item.usuario,
        item.status,
        getCameraLocationLabel(item, locationLabels),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [items, locationLabels, searchTerm])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!cameraToDelete) return

    setIsDeleting(true)

    try {
      await cameraService.delete(cameraToDelete.id)
      toast.success(deleteSuccessMessage)
      await Promise.all([loadItems(), loadStats()])
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, deleteErrorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <StatCards stats={stats} isLoading={isLoadingStats} />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.actions.search_placeholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>

          {canCreate ? (
            <Button
              onClick={() => {
                setEditingCamera(null)
                setIsFormOpen(true)
              }}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("table.actions.create")}
            </Button>
          ) : null}
        </div>

        <div className="relative rounded-md border bg-card">
          {isLoading ? <TableLoadingOverlay /> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.name")}</TableHead>
                <TableHead>{t("table.columns.access")}</TableHead>
                <TableHead>{t("table.columns.location")}</TableHead>
                {isAllCompanies ? <TableHead>{t("table.columns.company")}</TableHead> : null}
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("table.columns.updatedAt")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.nome || notInformed}</div>
                        <div className="text-xs text-muted-foreground">{item.marca || noBrand}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-xs">{item.ip || notInformed}</div>
                        <div className="text-xs text-muted-foreground">{item.usuario || noUser}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getCameraLocationLabel(item, locationLabels)}
                    </TableCell>
                    {isAllCompanies ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {getCameraCompanyName(item, companiesById, notInformed)}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <CameraStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {formatLocalizedDateTime(new Date(item.updatedAt), currentLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{t("table.open_actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailsItem(item)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("table.actions.view")}
                          </DropdownMenuItem>
                          {canUpdate ? (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setEditingCamera(item)
                                setIsFormOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("table.actions.edit")}
                            </DropdownMenuItem>
                          ) : null}
                          {canDelete ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => {
                                  setCameraToDelete(item)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("table.actions.delete")}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t("table.loading") : t("table.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePaginationFooter
          total={filteredItems.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <CameraDetailsDialog
        camera={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <CameraFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        camera={editingCamera}
        onSuccess={async () => {
          await Promise.all([loadItems(), loadStats()])
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        confirmText={t("table.actions.delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
