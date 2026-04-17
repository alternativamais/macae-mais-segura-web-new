"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  LogOut,
  Pencil,
  Plus,
  QrCode,
  RefreshCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { WhatsappAccount } from "@/types/email-integration"
import { WhatsappAccountDetailsDialog } from "./whatsapp-account-details-dialog"
import { WhatsappAccountFormDialog } from "./whatsapp-account-form-dialog"
import { WhatsappAccountSessionDialog } from "./whatsapp-account-session-dialog"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  getWhatsappSessionTag,
} from "./utils"

interface WhatsappAccountsTabProps {
  accounts: WhatsappAccount[]
  isLoading?: boolean
  onReload: () => Promise<void> | void
  onRefreshRecipients: () => Promise<void> | void
}

export function WhatsappAccountsTab({
  accounts,
  isLoading = false,
  onReload,
  onRefreshRecipients,
}: WhatsappAccountsTabProps) {
  const t = useTranslator("email_integrations.whatsapp_accounts")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.nome])),
    [companies],
  )
  const sessionLabels = useMemo(
    () => ({
      disconnected: t("session.disconnected"),
      initializing: t("session.initializing"),
      qr_required: t("session.qr_required"),
      authenticated: t("session.authenticated"),
      ready: t("session.ready"),
      auth_failure: t("session.auth_failure"),
    }),
    [t],
  )

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsItem, setDetailsItem] = useState<WhatsappAccount | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WhatsappAccount | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [sessionAccountId, setSessionAccountId] = useState<number | null>(null)
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<WhatsappAccount | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)

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
    if (isSessionDialogOpen) return
    const timeout = window.setTimeout(() => {
      setSessionAccountId(null)
      setIsSessionLoading(false)
    }, MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isSessionDialogOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return
    const timeout = window.setTimeout(() => setItemToDelete(null), MODAL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  useEffect(() => {
    const hasActiveSessions = accounts.some((account) =>
      ["initializing", "qr_required", "authenticated"].includes(account.sessionStatus),
    )

    if (!hasActiveSessions) return

    const interval = window.setInterval(() => {
      void onReload()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [accounts, onReload])

  const sessionAccount = useMemo(
    () => accounts.find((account) => account.id === sessionAccountId) || null,
    [accounts, sessionAccountId],
  )

  useEffect(() => {
    if (!isSessionDialogOpen || !sessionAccountId) return

    const status = sessionAccount?.sessionStatus
    const shouldPoll =
      isSessionLoading ||
      !sessionAccount ||
      ["initializing", "authenticated", "qr_required"].includes(status || "")

    if (!shouldPoll) return

    const interval = window.setInterval(() => {
      void onReload()
    }, 2000)

    return () => window.clearInterval(interval)
  }, [isSessionDialogOpen, isSessionLoading, onReload, sessionAccount, sessionAccountId])

  useEffect(() => {
    if (!isSessionDialogOpen || !isSessionLoading) return
    if (!sessionAccount) return

    if (sessionAccount.qrCodeDataUrl || sessionAccount.lastError || sessionAccount.sessionStatus === "ready") {
      setIsSessionLoading(false)
    }
  }, [isSessionDialogOpen, isSessionLoading, sessionAccount])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return accounts

    return accounts.filter((item) =>
      [
        item.name,
        item.displayName,
        item.phoneNumber,
        item.sessionStatus,
        item.notes,
        getCompanyName(companyNameById, item.empresaId),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [accounts, companyNameById, search])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      toast.success(successMessage)
      await onReload()
    } catch (error) {
      toast.apiError(error, t("notifications.action_error"))
    } finally {
      setPendingId(null)
    }
  }

  const handleConnect = async (item: WhatsappAccount) => {
    setSessionAccountId(item.id)
    setIsSessionDialogOpen(true)
    setIsSessionLoading(true)
    setPendingId(item.id)

    try {
      await emailIntegrationService.connectWhatsappAccount(item.id)
      await onReload()
      toast.success(t("notifications.connect_success"))
    } catch (error) {
      setIsSessionLoading(false)
      toast.apiError(error, t("notifications.connect_error"))
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await emailIntegrationService.deleteWhatsappAccount(itemToDelete.id)
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
              <TableHead>{t("table.account")}</TableHead>
              <TableHead>{t("table.company")}</TableHead>
              <TableHead>{t("table.connection")}</TableHead>
              <TableHead>{t("table.phone")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("table.updated_at")}</TableHead>
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
                      <div className="text-xs text-muted-foreground">{item.displayName || t("table.no_display_name")}</div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {getEnabledTag(item.enabled, {
                          enabled: t("status.enabled"),
                          disabled: t("status.disabled"),
                        })}
                        {getWhatsappSessionTag(item.sessionStatus, sessionLabels)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCompanyName(companyNameById, item.empresaId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.qrCodeDataUrl ? t("table.qr_available") : t("table.qr_not_available")}
                  </TableCell>
                  <TableCell>{item.phoneNumber || t("table.no_phone")}</TableCell>
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
                        <DropdownMenuItem
                          onClick={() => {
                            void handleConnect(item)
                          }}
                          disabled={pendingId === item.id}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          {t("actions.connect")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPendingId(item.id)
                            void runAction(
                              () => emailIntegrationService.resetWhatsappAccount(item.id),
                              t("notifications.reset_success"),
                            )
                          }}
                          disabled={pendingId === item.id}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {t("actions.reset")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPendingId(item.id)
                            void runAction(
                              async () => {
                                await emailIntegrationService.syncWhatsappRecipients(item.id)
                                await onRefreshRecipients()
                              },
                              t("notifications.sync_success"),
                            )
                          }}
                          disabled={pendingId === item.id}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {t("actions.sync_recipients")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPendingId(item.id)
                            void runAction(
                              () => emailIntegrationService.disconnectWhatsappAccount(item.id),
                              t("notifications.disconnect_success"),
                            )
                          }}
                          disabled={pendingId === item.id}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("actions.disconnect")}
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

      <WhatsappAccountDetailsDialog account={detailsItem} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <WhatsappAccountSessionDialog
        account={sessionAccount}
        open={isSessionDialogOpen}
        isLoading={isSessionLoading}
        onOpenChange={setIsSessionDialogOpen}
      />
      <WhatsappAccountFormDialog account={editingItem} open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={onReload} />
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
