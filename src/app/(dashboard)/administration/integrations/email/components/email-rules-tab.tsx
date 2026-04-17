"use client"

import { useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Pencil, Plus, Search, Send, Trash2 } from "lucide-react"
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
import { Camera } from "@/types/camera"
import {
  EmailPlateAlertRule,
  EmailRecipient,
  EmailSmtpAccount,
  WhatsappAccount,
  WhatsappRecipient,
} from "@/types/email-integration"
import { EmailRuleDetailsDialog } from "./email-rule-details-dialog"
import { EmailRuleFormDialog } from "./email-rule-form-dialog"
import { formatEmailIntegrationDateTime, getCompanyName } from "./utils"

interface EmailRulesTabProps {
  rules: EmailPlateAlertRule[]
  smtpAccounts: EmailSmtpAccount[]
  recipients: EmailRecipient[]
  whatsappAccounts: WhatsappAccount[]
  whatsappRecipients: WhatsappRecipient[]
  cameras: Camera[]
  isLoading?: boolean
  onReloadRules: () => Promise<void> | void
}

export function EmailRulesTab({
  rules,
  smtpAccounts,
  recipients,
  whatsappAccounts,
  whatsappRecipients,
  cameras,
  isLoading = false,
  onReloadRules,
}: EmailRulesTabProps) {
  const t = useTranslator("email_integrations.rules")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.nome])),
    [companies],
  )

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsItem, setDetailsItem] = useState<EmailPlateAlertRule | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailPlateAlertRule | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<EmailPlateAlertRule | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)

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
    if (!term) return rules

    return rules.filter((item) =>
      [
        item.name,
        item.description,
        item.camera?.nome,
        item.smtpAccount?.name,
        item.whatsappAccount?.name,
        getCompanyName(companyNameById, item.empresaId),
        item.plates.map((plate) => plate.plateText).join(" "),
        item.recipients.map((recipient) => recipient.name || recipient.email).join(" "),
        item.whatsappRecipients.map((recipient) => recipient.name || recipient.phoneNumber).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [companyNameById, rules, search])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)

    try {
      await emailIntegrationService.deleteRule(itemToDelete.id)
      toast.success(t("notifications.delete_success"))
      await onReloadRules()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("notifications.delete_error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTest = async (item: EmailPlateAlertRule) => {
    setTestingId(item.id)

    try {
      const result = await emailIntegrationService.testRule(item.id)
      const total = Object.values(result.channels || {}).reduce(
        (sum, channel) => sum + (channel?.recipientCount || 0),
        0,
      )
      toast.success(
        t("notifications.test_success", {
          count: String(total),
        }),
      )
    } catch (error) {
      toast.apiError(error, t("notifications.test_error"))
    } finally {
      setTestingId(null)
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
              <TableHead>{t("table.camera")}</TableHead>
              <TableHead>{t("table.delivery")}</TableHead>
              <TableHead>{t("table.plates")}</TableHead>
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
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description?.trim() || t("table.no_description")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCompanyName(companyNameById, item.empresaId)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{item.camera?.nome || `#${item.cameraId}`}</div>
                      <div className="text-xs text-muted-foreground">{item.camera?.ip || t("table.no_ip")}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>
                        {[
                          item.emailEnabled
                            ? item.smtpAccount?.name || (item.smtpAccountId ? `#${item.smtpAccountId}` : t("table.no_sender"))
                            : null,
                          item.whatsappEnabled
                            ? item.whatsappAccount?.name ||
                              (item.whatsappAccountId ? `#${item.whatsappAccountId}` : t("table.no_whatsapp"))
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.emailEnabled ? t("table.email_count", { count: String(item.recipients.length) }) : null}
                        {item.emailEnabled && item.whatsappEnabled ? " • " : null}
                        {item.whatsappEnabled
                          ? t("table.whatsapp_count", { count: String(item.whatsappRecipients.length) })
                          : null}
                      </div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {[...item.recipients.map((recipient) => recipient.name || recipient.email || `#${recipient.id}`),
                          ...item.whatsappRecipients.map((recipient) => recipient.name || recipient.phoneNumber || `#${recipient.id}`)]
                          .slice(0, 2)
                          .join(", ")}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.emailEnabled ? <DataTag tone="info">{t("channels.email")}</DataTag> : null}
                        {item.whatsappEnabled ? <DataTag tone="accent">{t("channels.whatsapp")}</DataTag> : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {item.plates.slice(0, 2).map((plate) => (
                        <DataTag key={plate.id} tone="info" monospace>
                          {plate.plateText}
                        </DataTag>
                      ))}
                      {item.plates.length > 2 ? (
                        <DataTag tone="neutral">+{item.plates.length - 2}</DataTag>
                      ) : null}
                    </div>
                  </TableCell>
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
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleTest(item)}
                          disabled={testingId === item.id}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {t("actions.test")}
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

      <EmailRuleDetailsDialog
        rule={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EmailRuleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rule={editingItem}
        smtpAccounts={smtpAccounts}
        recipients={recipients}
        whatsappAccounts={whatsappAccounts}
        whatsappRecipients={whatsappRecipients}
        cameras={cameras}
        onSuccess={onReloadRules}
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
