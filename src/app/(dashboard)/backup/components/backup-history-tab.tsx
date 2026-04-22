"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Download,
  EllipsisVertical,
  Eye,
  HardDriveDownload,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
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
import { backupService } from "@/services/backup.service"
import { BackupRecord } from "@/types/backup"
import { BackupDetailsDialog } from "./backup-details-dialog"
import { CreateBackupDialog } from "./create-backup-dialog"
import { RestoreBackupDialog } from "./restore-backup-dialog"
import { RestoreUploadDialog } from "./restore-upload-dialog"
import {
  BackupDropboxBadge,
  BackupOriginBadge,
  BackupStatusBadge,
  BackupStorageProviderBadge,
} from "./status-badges"
import { formatBytes, formatDateTime, formatLocaleNumber, getBackupSummary } from "./utils"
import { useTranslator } from "@/lib/i18n"

interface BackupHistoryTabProps {
  onRefreshComplete?: (backups: BackupRecord[]) => void
}

const FETCH_PAGE_SIZE = 100

export function BackupHistoryTab({
  onRefreshComplete,
}: BackupHistoryTabProps) {
  const { hasAnyPermission, hasPermission } = useHasPermission()
  const canRead = hasPermission("listar_backups")
  const canCreate = hasPermission("criar_backup")
  const canDownload = hasPermission("download_backup")
  const canRestore = hasPermission("restaurar_backup")
  const canDelete = hasPermission("deletar_backup")

  const [items, setItems] = useState<BackupRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUploadRestoreOpen, setIsUploadRestoreOpen] = useState(false)
  const [detailsItem, setDetailsItem] = useState<BackupRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [restoreItem, setRestoreItem] = useState<BackupRecord | null>(null)
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<BackupRecord | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslator("backup.history_tab")
  const currentLocale = t.getLocale()

  const loadItems = useCallback(async () => {
    if (!canRead) {
      setItems([])
      onRefreshComplete?.([])
      return
    }

    setIsLoading(true)

    try {
      const firstPage = await backupService.listBackups(1, FETCH_PAGE_SIZE)
      const totalPages = Math.max(1, Math.ceil(firstPage.total / FETCH_PAGE_SIZE))
      const remaining =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                backupService.listBackups(index + 2, FETCH_PAGE_SIZE)
              )
            )
          : []

      const records = [...firstPage.items, ...remaining.flatMap((response) => response.items)]
      setItems(records)
      onRefreshComplete?.(records)
    } catch (error) {
      toast.apiError(error, t("error_load"))
      setItems([])
      onRefreshComplete?.([])
    } finally {
      setIsLoading(false)
    }
  }, [canRead, onRefreshComplete])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isRestoreOpen) return

    const timeout = window.setTimeout(() => {
      setRestoreItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isRestoreOpen])

  useEffect(() => {
    if (isDeleteOpen) return

    const timeout = window.setTimeout(() => {
      setDeleteItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteOpen])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return items

    return items.filter((item) => {
      const summary = getBackupSummary(item)

      return [
        item.fileName,
        item.status,
        item.initiatedBy,
        item.failureReason,
        summary.notes,
        summary.format,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [items, searchTerm])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDownload = async (item: BackupRecord) => {
    try {
      const blob = await backupService.downloadBackup(item.id)
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = item.fileName || `backup-${item.id}.mmsbkp`
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(t("success_download"))
    } catch (error) {
      toast.apiError(error, t("error_download"))
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    setIsDeleting(true)
    try {
      await backupService.deleteBackup(deleteItem.id)
      toast.success(t("success_delete"))
      setIsDeleteOpen(false)
      await loadItems()
    } catch (error) {
      toast.apiError(error, t("error_delete"))
    } finally {
      setIsDeleting(false)
    }
  }

  if (!hasAnyPermission(["listar_backups", "criar_backup", "download_backup", "restaurar_backup"])) {
    return (
      <TabStateCard
        icon={HardDriveDownload}
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

        <div className="flex flex-col gap-2 sm:flex-row">
          {canRestore ? (
            <Button
              variant="outline"
              onClick={() => setIsUploadRestoreOpen(true)}
              className="cursor-pointer"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("btn_restore")}
            </Button>
          ) : null}
          {canCreate ? (
            <Button onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              {t("btn_new")}
            </Button>
          ) : null}
        </div>
      </div>

      {canRead ? (
        <>
          <div className="relative rounded-md border bg-card">
            {isLoading ? <TableLoadingOverlay /> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_file")}</TableHead>
                  <TableHead>{t("col_status")}</TableHead>
                  <TableHead>{t("col_summary")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("col_created")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("col_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => {
                    const summary = getBackupSummary(item)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.fileName || `backup-${item.id}`}</div>
                            <div className="text-xs text-muted-foreground">
                              {summary.format || t("format_unknown")} • {formatBytes(item.fileSizeBytes)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <BackupStatusBadge status={item.status} />
                            <BackupOriginBadge initiatedBy={item.initiatedBy} />
                            <BackupStorageProviderBadge storageProvider={item.storageProvider} />
                            <BackupDropboxBadge uploadedToDropbox={item.uploadedToDropbox} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {t("records_count", { count: formatLocaleNumber(summary.rowCount || 0, currentLocale) })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {summary.notes || item.failureReason || t("no_notes")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDateTime(item.createdAt, currentLocale)}
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
                              {canDownload ? (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleDownload(item)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {t("actions.download")}
                                </DropdownMenuItem>
                              ) : null}
                              {canRestore ? (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setRestoreItem(item)
                                    setIsRestoreOpen(true)
                                  }}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  {t("actions.restore")}
                                </DropdownMenuItem>
                              ) : null}
                              {canDelete ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setDeleteItem(item)
                                      setIsDeleteOpen(true)
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
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
        </>
      ) : (
        <TabStateCard
          icon={HardDriveDownload}
          title={t("no_permission_list_title")}
          description={t("no_permission_list_desc")}
        />
      )}

      <CreateBackupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={loadItems} />
      <RestoreUploadDialog
        open={isUploadRestoreOpen}
        onOpenChange={setIsUploadRestoreOpen}
        onSuccess={loadItems}
      />
      <BackupDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        backup={detailsItem}
      />
      <RestoreBackupDialog
        open={isRestoreOpen}
        onOpenChange={setIsRestoreOpen}
        backup={restoreItem}
        onSuccess={loadItems}
      />
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("delete_dialog.title")}
        description={t("delete_dialog.description", {
          file: deleteItem?.fileName || `backup-${deleteItem?.id ?? ""}`,
        })}
        confirmText={t("actions.delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
