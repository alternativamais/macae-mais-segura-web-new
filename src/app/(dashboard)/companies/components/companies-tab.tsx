"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { EllipsisVertical, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
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
import { empresaService } from "@/services/empresa.service"
import { Empresa } from "@/types/empresa"
import { CompanyDetailsDialog } from "./company-details-dialog"
import { CompanyFormDialog } from "./company-form-dialog"
import { CompanyStatusBadge } from "./status-badges"
import { formatLocalizedDate } from "@/lib/i18n/date"
import { parseISO } from "date-fns"
import { useTranslator } from "@/lib/i18n"
import { StatCards } from "./stat-cards"

export function CompaniesTab() {
  const [companies, setCompanies] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [detailsCompany, setDetailsCompany] = useState<Empresa | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Empresa | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Empresa | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const t = useTranslator("companies")
  const tTable = useTranslator("companies.table")
  const currentLocale = t.getLocale()

  const loadCompanies = useCallback(async () => {
    setIsLoading(true)
    try {
      // Note: We use findAllNoPagination for local filtering as per the current project style in Users
      // If the backend is large, we should switch to server-side pagination
      const data = await empresaService.findAllNoPagination()
      setCompanies(data || [])
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  // Cleanup for modals
  useEffect(() => {
    if (!isDetailsOpen) {
      const timeout = window.setTimeout(() => setDetailsCompany(null), MODAL_EXIT_DURATION_MS)
      return () => window.clearTimeout(timeout)
    }
  }, [isDetailsOpen])

  useEffect(() => {
    if (!isFormOpen) {
      const timeout = window.setTimeout(() => setEditingCompany(null), MODAL_EXIT_DURATION_MS)
      return () => window.clearTimeout(timeout)
    }
  }, [isFormOpen])

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return companies

    return companies.filter((company) =>
      [company.nome, company.cnpj]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [companies, searchTerm])

  const paginatedCompanies = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredCompanies.slice(startIndex, startIndex + pageSize)
  }, [filteredCompanies, page, pageSize])

  const handleDelete = async () => {
    if (!companyToDelete) return
    setIsDeleting(true)
    try {
      await empresaService.delete(companyToDelete.id)
      toast.success(tTable("delete_dialog.success"))
      await loadCompanies()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, tTable("delete_dialog.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <StatCards companies={companies} isLoading={isLoading} />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tTable("actions.search_placeholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            onClick={() => {
              setEditingCompany(null)
              setIsFormOpen(true)
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            {tTable("actions.create")}
          </Button>
        </div>

        <div className="relative rounded-md border bg-card">
          {isLoading ? <TableLoadingOverlay /> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tTable("columns.name")}</TableHead>
                <TableHead>{tTable("columns.cnpj")}</TableHead>
                <TableHead>{tTable("columns.status")}</TableHead>
                <TableHead>{tTable("columns.createdAt")}</TableHead>
                <TableHead className="w-[80px] text-right">{tTable("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="font-medium">{company.nome}</div>
                    </TableCell>
                    <TableCell>{company.cnpj || "-"}</TableCell>
                    <TableCell>
                      <CompanyStatusBadge status={company.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {company.createdAt 
                        ? formatLocalizedDate(parseISO(company.createdAt), currentLocale) 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{tTable("open_actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailsCompany(company)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {tTable("actions.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingCompany(company)
                              setIsFormOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {tTable("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setCompanyToDelete(company)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tTable("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {isLoading ? tTable("loading") : tTable("no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePaginationFooter
          total={filteredCompanies.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <CompanyDetailsDialog
        company={detailsCompany}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <CompanyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadCompanies}
        company={editingCompany || undefined}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={tTable("delete_dialog.title")}
        description={tTable("delete_dialog.description")}
        confirmText={tTable("actions.delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
