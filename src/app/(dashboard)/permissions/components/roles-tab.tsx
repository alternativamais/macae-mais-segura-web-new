"use client"

import { useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
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
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { roleService } from "@/services/role.service"
import { Role } from "@/types/role"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { RoleFormDialog } from "./role-form-dialog"
import { DetailsDialog } from "./details-dialog"
import { useTranslator } from "@/lib/i18n"
import { RoleScopeBadge } from "./role-scope-badge"
import { CompanyNameById, canManageRole } from "./utils"

interface RolesTabProps {
  roles: Role[]
  companyNameById: CompanyNameById
  isLoading: boolean
  isAllCompaniesView: boolean
  onRefresh: () => Promise<void> | void
}

export function RolesTab({
  roles,
  companyNameById,
  isLoading,
  isAllCompaniesView,
  onRefresh,
}: RolesTabProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<Role | undefined>()
  const [detailsRole, setDetailsRole] = useState<Role | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslator("permissions.roles_tab")
  const currentLocale = t.getLocale()

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsRole(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setRoleToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredRoles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return roles

    return roles.filter((role) =>
      [
        role.name,
        role.description,
        role.empresa?.nome,
        role.empresaId != null ? companyNameById[String(role.empresaId)] : null,
        role.empresaId == null ? t("global_role") : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [companyNameById, roles, searchTerm, t])

  const paginatedRoles = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredRoles.slice(startIndex, startIndex + pageSize)
  }, [filteredRoles, page, pageSize])

  const handleDelete = async () => {
    if (!roleToDelete) return

    setIsDeleting(true)
    try {
      await roleService.delete(roleToDelete.id)
      toast.success(t("delete_success"))
      await onRefresh()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("delete_error"))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isAllCompaniesView) {
    return (
      <TabStateCard
        icon={ShieldCheck}
        title={t("all_companies_title")}
        description={t("all_companies_desc")}
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

        <Button
          onClick={() => {
            setSelectedRole(undefined)
            setIsFormOpen(true)
          }}
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("new_role")}
        </Button>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("col_scope")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("col_updated")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRoles.length > 0 ? (
              paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        {role.name}
                      </div>
                      <div className="max-w-[420px] truncate text-xs text-muted-foreground">
                        {role.description || t("no_desc")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RoleScopeBadge role={role} companyNameById={companyNameById} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {role.updatedAt
                      ? formatLocalizedDateTime(new Date(role.updatedAt), currentLocale)
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
                              setDetailsRole(role)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("actions.view")}
                        </DropdownMenuItem>
                        {canManageRole(role, isAllCompaniesView) ? (
                          <>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedRole(role)
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
                                setRoleToDelete(role)
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
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {isLoading ? t("loading") : t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        total={filteredRoles.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        role={selectedRole}
        onRefresh={onRefresh}
      />

      <DetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title={t("details_title")}
        items={
          detailsRole
            ? [
                { label: t("details_name"), value: detailsRole.name },
                {
                  label: t("details_scope"),
                  value: detailsRole.empresaId == null
                    ? t("global_role")
                    : companyNameById[String(detailsRole.empresaId)] ||
                      t("company_role_fallback", { id: detailsRole.empresaId }),
                },
                { label: t("details_desc"), value: detailsRole.description || t("no_desc") },
                {
                  label: t("details_created"),
                  value: detailsRole.createdAt
                    ? formatLocalizedDateTime(new Date(detailsRole.createdAt), currentLocale)
                    : "-",
                },
                {
                  label: t("details_updated"),
                  value: detailsRole.updatedAt
                    ? formatLocalizedDateTime(new Date(detailsRole.updatedAt), currentLocale)
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
