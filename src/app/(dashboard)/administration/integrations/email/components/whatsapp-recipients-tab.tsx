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
import { WhatsappAccount, WhatsappRecipient } from "@/types/email-integration"
import { WhatsappRecipientDetailsDialog } from "./whatsapp-recipient-details-dialog"
import { WhatsappRecipientFormDialog } from "./whatsapp-recipient-form-dialog"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  getWhatsappRecipientTypeLabel,
} from "./utils"

interface WhatsappRecipientsTabProps {
  recipients: WhatsappRecipient[]
  accounts: WhatsappAccount[]
  isLoading?: boolean
  onReload: () => Promise<void> | void
}

export function WhatsappRecipientsTab({
  recipients,
  accounts,
  isLoading = false,
  onReload,
}: WhatsappRecipientsTabProps) {
  const t = useTranslator("email_integrations.whatsapp_recipients")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.nome])),
    [companies],
  )
  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  )
  const typeLabels = useMemo(
    () => ({
      manual: t("types.manual_phone"),
      contact: t("types.contact"),
      group: t("types.group"),
    }),
    [t],
  )

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsItem, setDetailsItem] = useState<WhatsappRecipient | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WhatsappRecipient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<WhatsappRecipient | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [pageSize, search])

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

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return recipients

    return recipients.filter((item) =>
      [
        item.name,
        item.phoneNumber,
        item.chatId,
        item.description,
        item.source,
        accountNameById.get(item.accountId || 0),
        getCompanyName(companyNameById, item.empresaId),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [accountNameById, companyNameById, recipients, search])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await emailIntegrationService.deleteWhatsappRecipient(itemToDelete.id)
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

        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true) }}>
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
              <TableHead>{t("table.target")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("table.updated_at")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{accountNameById.get(item.accountId || 0) || t("table.manual_account")}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getCompanyName(companyNameById, item.empresaId)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>{item.phoneNumber || t("table.no_phone")}</div>
                      <div className="text-xs text-muted-foreground break-all">{item.chatId || t("table.no_chat_id")}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <DataTag tone={item.type === "group" ? "accent" : item.type === "contact" ? "info" : "neutral"}>
                        {getWhatsappRecipientTypeLabel(item.type, typeLabels)}
                      </DataTag>
                      <DataTag tone={item.source === "imported" ? "success" : "warning"}>
                        {item.source === "imported" ? t("source.imported") : t("source.manual")}
                      </DataTag>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getEnabledTag(item.enabled, {
                      enabled: t("status.enabled"),
                      disabled: t("status.disabled"),
                    })}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatEmailIntegrationDateTime(item.updatedAt, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("actions.open_actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setDetailsItem(item); setIsDetailsOpen(true) }}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("actions.view")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setEditingItem(item); setIsFormOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => { setItemToDelete(item); setIsDeleteDialogOpen(true) }}
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

      <WhatsappRecipientDetailsDialog recipient={detailsItem} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <WhatsappRecipientFormDialog recipient={editingItem} open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={onReload} />
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
