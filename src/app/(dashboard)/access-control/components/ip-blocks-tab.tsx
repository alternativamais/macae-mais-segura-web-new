"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldBan,
  Trash2,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { accessControlService } from "@/services/access-control.service"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { AccessIpBlock } from "@/types/access-control"
import { useHasPermission } from "@/hooks/use-has-permission"
import { IpBlockFormDialog } from "./ip-block-form-dialog"
import { RuleDetailsDialog } from "./rule-details-dialog"
import { ActiveStatusBadge } from "./status-badges"
import { TableLoadingOverlay } from "./table-loading-overlay"
import { TablePaginationFooter } from "./table-pagination-footer"
import { TabStateCard } from "./tab-state-card"
import {
  formatDateTime,
  getIpBlockModeLabel,
  getRuleValue,
} from "./utils"
import { useTranslator } from "@/lib/i18n"

export function IpBlocksTab() {
  const { hasPermission } = useHasPermission()
  const canRead = hasPermission("listar_bloqueios_ip")
  const canCreate = hasPermission("criar_bloqueio_ip")
  const canUpdate = hasPermission("atualizar_bloqueio_ip")
  const canDelete = hasPermission("deletar_bloqueio_ip")

  const [items, setItems] = useState<AccessIpBlock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AccessIpBlock | undefined>()
  const [detailsItem, setDetailsItem] = useState<AccessIpBlock | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<AccessIpBlock | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslator("access_control.ip_blocks_tab")
  const tAccess = useTranslator("access_control")
  const currentLocale = t.getLocale()

  const loadItems = useCallback(async () => {
    if (!canRead) return

    setIsLoading(true)
    try {
      const data = await accessControlService.findIpBlocks()
      setItems(data)
    } catch (error) {
      toast.apiError(error, t("error_load"))
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [canRead])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

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

    return items.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        getIpBlockModeLabel(item.mode, tAccess),
        getRuleValue(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [items, searchTerm, tAccess])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const handleCreate = () => {
    setSelectedItem(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (item: AccessIpBlock) => {
    setSelectedItem(item)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      await accessControlService.deleteIpBlock(itemToDelete.id)
      toast.success(t("success_delete"))
      await loadItems()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("error_delete"))
    } finally {
      setIsDeleting(false)
    }
  }

  if (!canRead) {
    return (
      <TabStateCard
        icon={ShieldBan}
        title={t("no_permission_title")}
        description={t("no_permission_desc")}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>

        {canCreate ? (
          <Button onClick={handleCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            {t("new_block")}
          </Button>
        ) : null}
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_id")}</TableHead>
              <TableHead>{t("col_mode")}</TableHead>
              <TableHead>{t("col_value")}</TableHead>
              <TableHead>{t("col_status")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("col_updated")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{item.label || t("no_id")}</div>
                      <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                        {item.description || t("no_desc")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getIpBlockModeLabel(item.mode, tAccess)}</TableCell>
                  <TableCell className="font-mono text-xs">{getRuleValue(item)}</TableCell>
                  <TableCell>
                    <ActiveStatusBadge active={item.active} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDateTime(item.updatedAt, currentLocale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("open_actions")}</span>
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
                          {t("actions.view")}
                        </DropdownMenuItem>
                        {canUpdate ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("actions.edit")}
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
                              {t("actions.delete")}
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
                  {isLoading ? t("loading") : t("empty")}
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

      <IpBlockFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadItems}
        ipBlock={selectedItem}
      />

      <RuleDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title={t("details_title")}
        items={
          detailsItem
            ? [
                { label: t("details_id"), value: detailsItem.label || t("no_id") },
                { label: t("details_mode"), value: getIpBlockModeLabel(detailsItem.mode, tAccess) },
                { label: t("details_value"), value: getRuleValue(detailsItem) },
                { label: t("details_status"), value: detailsItem.active ? t("status_active") : t("status_inactive") },
                { label: t("details_desc"), value: detailsItem.description || t("no_desc") },
                { label: t("details_created"), value: formatDateTime(detailsItem.createdAt, currentLocale) },
                { label: t("details_updated"), value: formatDateTime(detailsItem.updatedAt, currentLocale) },
              ]
            : []
        }
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("delete_title")}
        description={t("delete_desc")}
        confirmText={t("button_delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
