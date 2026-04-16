"use client"

import { useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { EmailRecipient } from "@/types/email-integration"
import { EmailRecipientDetailsDialog } from "./email-recipient-details-dialog"
import { EmailRecipientFormDialog } from "./email-recipient-form-dialog"
import { formatEmailIntegrationDateTime, getCompanyName } from "./utils"

interface EmailRecipientsTabProps {
  recipients: EmailRecipient[]
  isLoading?: boolean
  onReload: () => Promise<void> | void
}

export function EmailRecipientsTab({
  recipients,
  isLoading = false,
  onReload,
}: EmailRecipientsTabProps) {
  const t = useTranslator("email_integrations.recipients")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.nome])),
    [companies],
  )

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsItem, setDetailsItem] = useState<EmailRecipient | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailRecipient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<EmailRecipient | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [pageSize, search])

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
    const term = search.trim().toLowerCase()
    if (!term) return recipients

    return recipients.filter((item) =>
      [item.name, item.email, item.description, getCompanyName(companyNameById, item.empresaId)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [companyNameById, recipients, search])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)

    try {
      await emailIntegrationService.deleteRecipient(itemToDelete.id)
      toast.success(t("notifications.delete_success"))
      await onReload()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("notifications.delete_error"))
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search_placeholder")}
            className="pl-9"
          />
        </div>

        <Button
          className="cursor-pointer"
          onClick={() => {
            setEditingItem(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("actions.create")}
        </Button>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.company")}</TableHead>
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("table.updated_at")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description?.trim() || t("table.no_description")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCompanyName(companyNameById, item.empresaId)}</TableCell>
                  <TableCell className="font-mono text-sm">{item.email}</TableCell>
                  <TableCell>
                    {item.enabled ? (
                      <DataTag tone="success">{t("status.enabled")}</DataTag>
                    ) : (
                      <DataTag tone="neutral">{t("status.disabled")}</DataTag>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatEmailIntegrationDateTime(item.updatedAt, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("actions.open_actions")}</span>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setEditingItem(item)
                            setIsFormOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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

      <EmailRecipientDetailsDialog
        recipient={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EmailRecipientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        recipient={editingItem}
        onSuccess={onReload}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("delete_dialog.title")}
        description={t("delete_dialog.description")}
        confirmText={t("delete_dialog.confirm")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
