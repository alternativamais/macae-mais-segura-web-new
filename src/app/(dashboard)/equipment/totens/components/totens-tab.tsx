"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Cpu,
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
import { totemService } from "@/services/totem.service"
import { Totem } from "@/types/totem"
import { StatCards } from "./stat-cards"
import { TotemDetailsDialog } from "./totem-details-dialog"
import { TotemFormDialog } from "./totem-form-dialog"
import { TotemStatusBadge } from "./status-badges"
import {
  formatTotemDateTime,
  getTotemCompanyName,
  getTotemExtensionLabel,
  getTotemIntegratedEquipmentCount,
  getTotemPointLabel,
  getTotemPointReference,
} from "./utils"

export function TotensTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("totens")
  const currentLocale = t.getLocale()
  const { isAllCompanies, companiesById } = useCompanyVisibility()

  const canCreate = hasPermission("criar_toten")
  const canUpdate = hasPermission("atualizar_toten")
  const canDelete = hasPermission("deletar_toten")

  const [totens, setTotens] = useState<Totem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsTotem, setDetailsTotem] = useState<Totem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingTotem, setEditingTotem] = useState<Totem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [totemToDelete, setTotemToDelete] = useState<Totem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadErrorMessage = t("fetch_error")
  const notInformed = t("shared.not_informed")
  const unassignedExtension = t("shared.unassigned_extension")
  const noReference = t("shared.no_reference")

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await totemService.findAllNoPagination()
      setTotens(data)
    } catch (error) {
      toast.apiError(error, loadErrorMessage)
      setTotens([])
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
      setDetailsTotem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return

    const timeout = window.setTimeout(() => {
      setEditingTotem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setTotemToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredTotens = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return totens

    return totens.filter((totem) =>
      [
        totem.numero,
        getTotemPointLabel(totem, notInformed),
        getTotemPointReference(totem, noReference),
        getTotemExtensionLabel(totem, unassignedExtension),
        totem.callCenterExtension?.descricao,
        totem.callCenterExtension?.queueName,
        totem.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [noReference, notInformed, searchTerm, totens, unassignedExtension])

  const paginatedTotens = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredTotens.slice(startIndex, startIndex + pageSize)
  }, [filteredTotens, page, pageSize])

  const handleDelete = async () => {
    if (!totemToDelete) return

    setIsDeleting(true)

    try {
      await totemService.delete(totemToDelete.id)
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
      <StatCards totems={totens} isLoading={isLoading} />

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
                setEditingTotem(null)
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
                <TableHead>{t("table.columns.number")}</TableHead>
                <TableHead>{t("table.columns.point")}</TableHead>
                <TableHead>{t("table.columns.extension")}</TableHead>
                <TableHead>{t("table.columns.integrations")}</TableHead>
                {isAllCompanies ? <TableHead>{t("table.columns.company")}</TableHead> : null}
                <TableHead className="hidden md:table-cell">{t("table.columns.status")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("table.columns.updated_at")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTotens.length > 0 ? (
                paginatedTotens.map((totem) => (
                  <TableRow key={totem.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{totem.numero}</div>
                        <div className="text-xs text-muted-foreground">#{totem.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {getTotemPointLabel(totem, notInformed)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getTotemPointReference(totem, noReference)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-xs">
                          {getTotemExtensionLabel(totem, unassignedExtension)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totem.callCenterExtension?.descricao ||
                            totem.callCenterExtension?.queueName ||
                            notInformed}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <Cpu className="h-3.5 w-3.5" />
                        {t("table.integrations_count", {
                          count: getTotemIntegratedEquipmentCount(totem),
                        })}
                      </div>
                    </TableCell>
                    {isAllCompanies ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {getTotemCompanyName(totem, companiesById, notInformed)}
                      </TableCell>
                    ) : null}
                    <TableCell className="hidden md:table-cell">
                      <TotemStatusBadge status={totem.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {formatTotemDateTime(totem.updatedAt, currentLocale)}
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
                              setDetailsTotem(totem)
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
                                setEditingTotem(totem)
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
                                  setTotemToDelete(totem)
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
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t("table.loading") : t("table.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePaginationFooter
          total={filteredTotens.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <TotemDetailsDialog
        totem={detailsTotem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <TotemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
        totem={editingTotem}
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
