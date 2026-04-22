"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FileJson } from "lucide-react"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { integrationService } from "@/services/integration.service"
import {
  Integration,
  IntegrationCameraBinding,
  IntegrationLog,
  IntegrationLogDetail,
} from "@/types/integration"
import { formatJsonPayload, formatLogDirection, getLogStatusVariant } from "./utils"

interface IntegrationLogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  binding: IntegrationCameraBinding | null
}

export function IntegrationLogsDialog({
  open,
  onOpenChange,
  integration,
  binding,
}: IntegrationLogsDialogProps) {
  const t = useTranslator("plate_sending")
  const currentLocale = t.getLocale()
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [selectedLog, setSelectedLog] = useState<IntegrationLogDetail | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const loadLogs = useCallback(async () => {
    if (!binding) return

    setIsLoading(true)

    try {
      const response = await integrationService.listLogs(
        integration.code,
        binding.id,
        page,
        pageSize,
      )
      setLogs(response.data || [])
      setTotal(response.total || 0)
    } catch (error) {
      setLogs([])
      setTotal(0)
      toast.apiError(error, t("logs.notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [binding, integration.code, page, pageSize, t])

  useEffect(() => {
    if (!open || !binding) return
    void loadLogs()
  }, [binding, loadLogs, open])

  useEffect(() => {
    if (!open) {
      setLogs([])
      setSelectedLog(null)
      setSelectedLogId(null)
      setPage(1)
      setPageSize(10)
      setTotal(0)
    }
  }, [open])

  useEffect(() => {
    if (!open || !binding || !selectedLogId) return

    let isMounted = true
    setIsLoadingDetails(true)

    void integrationService
      .getLogDetails(integration.code, binding.id, selectedLogId)
      .then((data) => {
        if (!isMounted) return
        setSelectedLog(data)
      })
      .catch((error) => {
        if (!isMounted) return
        setSelectedLog(null)
        setSelectedLogId(null)
        toast.apiError(error, t("logs.notifications.load_error"))
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingDetails(false)
      })

    return () => {
      isMounted = false
    }
  }, [binding, integration.code, open, selectedLogId, t])

  const title = useMemo(
    () =>
      t("logs.title", {
        camera:
          binding?.camera?.nome ||
          t("management.camera_name_fallback", { id: binding?.cameraId || 0 }),
      }),
    [binding?.camera?.nome, binding?.cameraId, t],
  )

  const handleOpenLogDetails = useCallback((log: IntegrationLog) => {
    setSelectedLog(null)
    setSelectedLogId(log.id)
  }, [])

  const handleCloseLogDetails = useCallback(() => {
    setSelectedLog(null)
    setSelectedLogId(null)
    setIsLoadingDetails(false)
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{t("logs.description")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("logs.columns.plate")}</TableHead>
                  <TableHead>{t("logs.columns.identifier")}</TableHead>
                  <TableHead>{t("logs.columns.direction")}</TableHead>
                  <TableHead>{t("logs.columns.status")}</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("logs.columns.error")}
                  </TableHead>
                  <TableHead>{t("logs.columns.sent_at")}</TableHead>
                  <TableHead className="w-[90px] text-right">
                    {t("logs.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.plateText || t("shared.not_informed")}</TableCell>
                      <TableCell>{log.codCet || t("shared.not_informed")}</TableCell>
                      <TableCell>
                        {t(`management.direction_values.${formatLogDirection(log.direction).toLowerCase()}`)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLogStatusVariant(log.success)}>
                          {log.success
                            ? t("logs.status.success")
                            : log.responseStatus || t("logs.status.error")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[240px] truncate xl:table-cell">
                        {log.errorMessage || t("logs.no_error")}
                      </TableCell>
                      <TableCell>
                        {log.sentAt
                          ? formatLocalizedDateTime(new Date(log.sentAt), currentLocale)
                          : t("shared.not_informed")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => handleOpenLogDetails(log)}
                        >
                          <FileJson className="h-4 w-4" />
                          <span className="sr-only">{t("logs.actions.view_payload")}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {isLoading ? t("loading") : t("logs.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {t("logs.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedLogId)}
        onOpenChange={(nextOpen) => !nextOpen && handleCloseLogDetails()}
      >
        <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("logs.details_title")}</DialogTitle>
            <DialogDescription>{t("logs.details_description")}</DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 gap-4 overflow-hidden lg:grid-cols-2">
            <div className="min-h-0 space-y-2 overflow-hidden">
              <p className="text-sm font-medium">{t("logs.request_payload")}</p>
              <pre className="min-h-[280px] overflow-auto rounded-lg border bg-muted/20 p-4 text-xs">
                {isLoadingDetails
                  ? t("loading")
                  : formatJsonPayload(selectedLog?.requestPayload)}
              </pre>
            </div>

            <div className="min-h-0 space-y-2 overflow-hidden">
              <p className="text-sm font-medium">{t("logs.response_payload")}</p>
              <pre className="min-h-[280px] overflow-auto rounded-lg border bg-muted/20 p-4 text-xs">
                {isLoadingDetails
                  ? t("loading")
                  : formatJsonPayload(selectedLog?.responsePayload)}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleCloseLogDetails}
            >
              {t("logs.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
