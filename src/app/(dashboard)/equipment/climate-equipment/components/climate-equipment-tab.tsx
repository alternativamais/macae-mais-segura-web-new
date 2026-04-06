"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  LineChart,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
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
import { useHasPermission } from "@/hooks/use-has-permission"
import { climateEquipmentService } from "@/services/climate-equipment.service"
import { ClimateEquipment } from "@/types/climate-equipment"
import { ClimateEquipmentDetailsDialog } from "./climate-equipment-details-dialog"
import { ClimateEquipmentFormDialog } from "./climate-equipment-form-dialog"
import { ClimateEquipmentStatusBadge, ClimateSensorAvailabilityBadge } from "./status-badges"
import {
  formatClimateDateTime,
  getClimateEquipmentDisplayName,
  getClimateLocationPrimaryLabel,
  getClimateLocationSecondaryLabel,
} from "./utils"

interface ClimateEquipmentTabProps {
  items: ClimateEquipment[]
  isLoading?: boolean
  onOpenDashboard: (id: number) => void
  onRefreshData: () => void | Promise<void>
}

export function ClimateEquipmentTab({
  items,
  isLoading = false,
  onOpenDashboard,
  onRefreshData,
}: ClimateEquipmentTabProps) {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("climate_equipment")
  const currentLocale = t.getLocale()

  const canCreate = hasPermission("criar_climate_equipments")
  const canUpdate = hasPermission("atualizar_climate_equipments")
  const canDelete = hasPermission("deletar_climate_equipments")
  const canSync = hasPermission("sincronizar_climate_equipments")

  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isSyncingId, setIsSyncingId] = useState<number | null>(null)

  const [detailsItem, setDetailsItem] = useState<ClimateEquipment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClimateEquipment | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ClimateEquipment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return
    const timeout = window.setTimeout(() => setDetailsItem(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return
    const timeout = window.setTimeout(() => setEditingItem(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return
    const timeout = window.setTimeout(() => setItemToDelete(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const locationLabels = {
    point: t("location.point"),
    totem: t("location.totem"),
    noReference: t("location.no_reference"),
    unassigned: t("location.unassigned"),
    fallback: t("shared.not_informed"),
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return items

    return items.filter((item) =>
      [
        getClimateEquipmentDisplayName(item, ""),
        item.homeAssistantDeviceKey,
        item.homeAssistantLabel,
        getClimateLocationPrimaryLabel(item, locationLabels),
        getClimateLocationSecondaryLabel(item, locationLabels),
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [items, locationLabels, searchTerm])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      await climateEquipmentService.delete(itemToDelete.id)
      toast.success(t("table.delete_dialog.success"))
      await onRefreshData()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("table.delete_dialog.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSync = async (item: ClimateEquipment) => {
    setIsSyncingId(item.id)

    try {
      await climateEquipmentService.sync(item.id)
      toast.success(t("table.sync_success"))
      await onRefreshData()
    } catch (error) {
      toast.apiError(error, t("table.sync_error"))
    } finally {
      setIsSyncingId(null)
    }
  }

  return (
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
              setEditingItem(null)
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
              <TableHead>{t("table.columns.installation")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("table.columns.sensors")}</TableHead>
              <TableHead>{t("table.columns.status")}</TableHead>
              <TableHead className="hidden xl:table-cell">
                {t("table.columns.last_synced_at")}
              </TableHead>
              <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {getClimateEquipmentDisplayName(item, t("shared.not_informed"))}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.homeAssistantDeviceKey}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {getClimateLocationPrimaryLabel(item, locationLabels)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getClimateLocationSecondaryLabel(item, locationLabels)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        {t("table.sensors_count", { count: item.sensors.length })}
                      </div>
                      {item.sensors.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.sensors.slice(0, 2).map((sensor) => (
                            <ClimateSensorAvailabilityBadge
                              key={`${item.id}-${sensor.id}`}
                              available={sensor.isAvailable}
                            />
                          ))}
                          {item.sensors.length > 2 ? (
                            <span className="text-xs text-muted-foreground">
                              {t("table.more_sensors", { count: item.sensors.length - 2 })}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ClimateEquipmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {formatClimateDateTime(item.lastSyncedAt, currentLocale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("table.open_actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        onClick={(event) => event.stopPropagation()}
                      >
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

                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onOpenDashboard(item.id)}
                        >
                          <LineChart className="mr-2 h-4 w-4" />
                          {t("table.actions.view_dashboard")}
                        </DropdownMenuItem>

                        {canSync ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleSync(item)}
                            disabled={isSyncingId === item.id}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            {t("table.actions.sync")}
                          </DropdownMenuItem>
                        ) : null}

                        {canUpdate || canDelete ? <DropdownMenuSeparator /> : null}

                        {canUpdate ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingItem(item)
                              setIsFormOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("table.actions.edit")}
                          </DropdownMenuItem>
                        ) : null}

                        {canDelete ? (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setItemToDelete(item)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("table.actions.delete")}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
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

      <ClimateEquipmentDetailsDialog
        item={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <ClimateEquipmentFormDialog
        item={editingItem}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={onRefreshData}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
