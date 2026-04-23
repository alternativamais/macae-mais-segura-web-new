"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTag } from "@/components/shared/data-tag"
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
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { permissionService } from "@/services/permission.service"
import { Permission } from "@/types/permission"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { DetailsDialog } from "./details-dialog"
import { PermissionFormDialog } from "./permission-form-dialog"
import { useTranslator } from "@/lib/i18n"

export function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPermission, setSelectedPermission] = useState<Permission | undefined>()
  const [detailsPermission, setDetailsPermission] = useState<Permission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslator("permissions.permissions_tab")
  const currentLocale = t.getLocale()

  const loadPermissions = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await permissionService.findAllNoPagination()
      setPermissions(data)
    } catch (error) {
      toast.apiError(error, t("load_error"))
      setPermissions([])
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsPermission(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setPermissionToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return permissions

    return permissions.filter((permission) =>
      [permission.name, permission.group]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [permissions, searchTerm])

  const paginatedPermissions = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredPermissions.slice(startIndex, startIndex + pageSize)
  }, [filteredPermissions, page, pageSize])

  const handleDelete = async () => {
    if (!permissionToDelete) return

    setIsDeleting(true)
    try {
      await permissionService.delete(permissionToDelete.id)
      toast.success(t("delete_success"))
      await loadPermissions()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("delete_error"))
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
            placeholder={t("search")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => {
            setSelectedPermission(undefined)
            setIsFormOpen(true)
          }}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_name")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("col_updated")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPermissions.length > 0 ? (
              paginatedPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary">{permission.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {permission.group ? (
                          <DataTag tone="neutral">{permission.group}</DataTag>
                        ) : (
                          t("no_group")
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {permission.updatedAt
                      ? formatLocalizedDateTime(new Date(permission.updatedAt), currentLocale)
                      : "-"}
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
                              setDetailsPermission(permission)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("actions.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedPermission(permission)
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
                            setPermissionToDelete(permission)
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {isLoading ? t("loading") : t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        total={filteredPermissions.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <PermissionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        permission={selectedPermission}
        onRefresh={loadPermissions}
      />

      <DetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title={t("details_title")}
        items={
          detailsPermission
            ? [
                { label: t("details_key"), value: detailsPermission.name },
                { label: t("details_group"), value: detailsPermission.group || t("no_group") },
                {
                  label: t("details_created"),
                  value: detailsPermission.createdAt
                    ? formatLocalizedDateTime(new Date(detailsPermission.createdAt), currentLocale)
                    : "-",
                },
                {
                  label: t("details_updated"),
                  value: detailsPermission.updatedAt
                    ? formatLocalizedDateTime(new Date(detailsPermission.updatedAt), currentLocale)
                    : "-",
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("delete_dialog_title")}
        description={t("delete_dialog_desc")}
        confirmText={t("button_delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
