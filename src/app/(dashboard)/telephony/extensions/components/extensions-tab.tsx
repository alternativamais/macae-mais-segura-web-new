"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react"
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
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { callCenterExtensionService } from "@/services/call-center-extension.service"
import {
  CallCenterExtension,
  CallCenterExtensionType,
} from "@/types/call-center-extension"
import { parseISO } from "date-fns"
import { ExtensionDetailsDialog } from "./extension-details-dialog"
import { ExtensionFormDialog } from "./extension-form-dialog"
import { ExtensionStatusBadge, ExtensionTypeBadge } from "./status-badges"
import { StatCards } from "./stat-cards"
import { getExtensionSearchIndex, getExtensionTotemLabel } from "./utils"

const ALL_TYPES = "__all__"

export function ExtensionsTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("call_center_extensions")
  const currentLocale = t.getLocale()

  const canManage = hasPermission("gerenciar_callcenter_ramais")

  const [extensions, setExtensions] = useState<CallCenterExtension[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsExtension, setDetailsExtension] = useState<CallCenterExtension | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingExtension, setEditingExtension] = useState<CallCenterExtension | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [extensionToDelete, setExtensionToDelete] = useState<CallCenterExtension | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await callCenterExtensionService.findAllNoPagination()
      setExtensions(data)
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setExtensions([])
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm, typeFilter])

  useEffect(() => {
    if (isDetailsOpen) return
    const timeout = window.setTimeout(() => setDetailsExtension(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return
    const timeout = window.setTimeout(() => setEditingExtension(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return
    const timeout = window.setTimeout(() => setExtensionToDelete(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredExtensions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return extensions.filter((extension) => {
      const matchesType =
        typeFilter === ALL_TYPES ? true : extension.type === typeFilter

      const matchesSearch = normalizedSearch
        ? getExtensionSearchIndex(extension, t("shared.unlinked_totem")).includes(normalizedSearch)
        : true

      return matchesType && matchesSearch
    })
  }, [extensions, searchTerm, t, typeFilter])

  const paginatedExtensions = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredExtensions.slice(startIndex, startIndex + pageSize)
  }, [filteredExtensions, page, pageSize])

  const handleDelete = async () => {
    if (!extensionToDelete) return

    setIsDeleting(true)

    try {
      await callCenterExtensionService.delete(extensionToDelete.id)
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
      <StatCards extensions={extensions} isLoading={isLoading} />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("table.actions.search_placeholder")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t("table.actions.filter_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES}>{t("table.actions.filter_all")}</SelectItem>
                <SelectItem value="operator">{t("table.type_operator")}</SelectItem>
                <SelectItem value="totem">{t("table.type_totem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canManage ? (
            <Button
              onClick={() => {
                setEditingExtension(null)
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
                <TableHead>{t("table.columns.description")}</TableHead>
                <TableHead>{t("table.columns.queue")}</TableHead>
                <TableHead>{t("table.columns.type")}</TableHead>
                <TableHead>{t("table.columns.totem")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("table.columns.updated_at")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExtensions.length > 0 ? (
                paginatedExtensions.map((extension) => (
                  <TableRow key={extension.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{extension.numeroRamal}</div>
                        <div className="text-xs text-muted-foreground">#{extension.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{extension.descricao || t("shared.not_informed")}</TableCell>
                    <TableCell>{extension.queueName || t("shared.not_informed")}</TableCell>
                    <TableCell>
                      <ExtensionTypeBadge type={extension.type} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {getExtensionTotemLabel(extension, t("shared.unlinked_totem"))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {extension.totem?.ponto?.nome ||
                            extension.totem?.ponto?.pontoDeReferencia ||
                            t("shared.not_informed")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ExtensionStatusBadge status={extension.status} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                      {extension.updatedAt
                        ? formatLocalizedDateTime(parseISO(extension.updatedAt), currentLocale)
                        : t("shared.not_informed")}
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
                              setDetailsExtension(extension)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("table.actions.view")}
                          </DropdownMenuItem>
                          {canManage ? (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setEditingExtension(extension)
                                setIsFormOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("table.actions.edit")}
                            </DropdownMenuItem>
                          ) : null}
                          {canManage ? <DropdownMenuSeparator /> : null}
                          {canManage ? (
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => {
                                setExtensionToDelete(extension)
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t("loading") : t("table.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePaginationFooter
          total={filteredExtensions.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ExtensionDetailsDialog
        extension={detailsExtension}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <ExtensionFormDialog
        extension={editingExtension}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        confirmText={t("table.actions.delete")}
        cancelText={t("form.buttons.cancel")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
