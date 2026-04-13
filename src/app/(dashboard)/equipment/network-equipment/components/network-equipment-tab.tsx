"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
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
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useHasPermission } from "@/hooks/use-has-permission"
import { networkEquipmentService } from "@/services/network-equipment.service"
import { NetworkEquipment } from "@/types/network-equipment"
import { NetworkEquipmentDetailsDialog } from "./network-equipment-details-dialog"
import { NetworkEquipmentFormDialog } from "./network-equipment-form-dialog"
import {
  NetworkEquipmentOnlineBadge,
  NetworkEquipmentStatusBadge,
  NetworkEquipmentTypeBadge,
} from "./status-badges"
import { StatCards } from "./stat-cards"
import {
  formatNetworkEquipmentDateTime,
  getNetworkEquipmentCompanyName,
  getNetworkEquipmentLocationPrimaryLabel,
  getNetworkEquipmentLocationSecondaryLabel,
} from "./utils"

export function NetworkEquipmentTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("network_equipment")
  const currentLocale = t.getLocale()
  const { isAllCompanies, companiesById } = useCompanyVisibility()

  const canCreate = hasPermission("criar_wifi_macae")
  const canUpdate = hasPermission("atualizar_wifi_macae")
  const canDelete = hasPermission("deletar_wifi_macae")

  const [items, setItems] = useState<NetworkEquipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsItem, setDetailsItem] = useState<NetworkEquipment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NetworkEquipment | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<NetworkEquipment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadErrorMessage = t("fetch_error")
  const notInformed = t("shared.not_informed")
  const noReference = t("location.no_reference")

  const locationLabels = {
    point: t("location.point"),
    totem: t("location.totem"),
    noReference,
    fallback: notInformed,
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await networkEquipmentService.findAllNoPagination()
      setItems(data)
    } catch (error) {
      toast.apiError(error, loadErrorMessage)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [loadErrorMessage])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      setEditingItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setItemToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return items

    return items.filter((item) =>
      [
        item.nome,
        item.tipoEquipamento,
        item.ip,
        item.macAddress,
        item.usuarioGerencia,
        getNetworkEquipmentLocationPrimaryLabel(item, locationLabels),
        getNetworkEquipmentLocationSecondaryLabel(item, locationLabels),
        item.status,
        item.online ? t("table.online.true") : t("table.online.false"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [items, locationLabels, searchTerm, t])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)

    try {
      await networkEquipmentService.delete(itemToDelete.id)
      toast.success(t("table.delete_dialog.success"))
      await loadData()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("table.delete_dialog.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <StatCards items={items} isLoading={isLoading} />

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
                <TableHead>{t("table.columns.type")}</TableHead>
                <TableHead>{t("table.columns.location")}</TableHead>
                <TableHead>{t("table.columns.network")}</TableHead>
                {isAllCompanies ? <TableHead>{t("table.columns.company")}</TableHead> : null}
                <TableHead>{t("table.columns.online")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.columns.status")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("table.columns.updated_at")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.nome}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.macAddress || notInformed}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <NetworkEquipmentTypeBadge type={item.tipoEquipamento} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {getNetworkEquipmentLocationPrimaryLabel(item, locationLabels)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getNetworkEquipmentLocationSecondaryLabel(item, locationLabels)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-xs">{item.ip}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.usuarioGerencia || notInformed}
                        </div>
                      </div>
                    </TableCell>
                    {isAllCompanies ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {getNetworkEquipmentCompanyName(item, companiesById, notInformed)}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <NetworkEquipmentOnlineBadge online={item.online} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <NetworkEquipmentStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {formatNetworkEquipmentDateTime(item.updatedAt, currentLocale)}
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
                                setEditingItem(item)
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
                                  setItemToDelete(item)
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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

      <NetworkEquipmentDetailsDialog
        item={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <NetworkEquipmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
        item={editingItem}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
