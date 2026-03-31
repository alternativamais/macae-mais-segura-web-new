"use client"

import { useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye } from "lucide-react"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { useTranslator } from "@/lib/i18n"
import { ApiLogRecord, AuditLogRecord, LogType } from "@/types/log"
import { LogDetailsDialog } from "./log-details-dialog"
import {
  LogLevelBadge,
  MethodBadge,
  OriginBadge,
  StatusCodeBadge,
} from "./status-badges"
import {
  formatDuration,
  formatLogDateTime,
  getAuditEntityLabel,
  getUserLogLabel,
} from "./utils"

interface LogsTableProps {
  type: LogType
  logs: ApiLogRecord[] | AuditLogRecord[]
  total: number
  isLoading: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function LogsTable({
  type,
  logs,
  total,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: LogsTableProps) {
  const t = useTranslator("logs.table")
  const tRoot = useTranslator("logs")
  const locale = t.getLocale()
  const [selectedLog, setSelectedLog] = useState<ApiLogRecord | AuditLogRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setSelectedLog(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  const columns = useMemo(() => {
    if (type === "api") {
      return [
        t("columns.event"),
        t("columns.result"),
        t("columns.user"),
        t("columns.origin"),
        t("columns.message"),
        t("columns.date"),
        t("columns.actions"),
      ]
    }

    return [
      t("columns.event"),
      t("columns.context"),
      t("columns.user"),
      t("columns.origin"),
      t("columns.message"),
      t("columns.date"),
      t("columns.actions"),
    ]
  }, [t, type])

  return (
    <>
      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className={column === t("columns.actions") ? "text-right" : ""}>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => {
                const apiLog = type === "api" ? (log as ApiLogRecord) : undefined
                const auditLog = type === "audit" ? (log as AuditLogRecord) : undefined

                return (
                  <TableRow key={log.id}>
                    <TableCell className="align-top">
                      {type === "api" && apiLog ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <MethodBadge method={apiLog.method} />
                            <span className="font-medium">{apiLog.url || tRoot("shared.empty_value")}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("labels.request_id")}: {apiLog.requestId || tRoot("shared.empty_value")}
                          </div>
                        </div>
                      ) : null}

                      {type === "audit" && auditLog ? (
                        <div className="space-y-1">
                          <div className="font-medium">{auditLog.action || t("empty.no_action")}</div>
                          <div className="text-xs text-muted-foreground">
                            {getAuditEntityLabel(auditLog, tRoot)}
                          </div>
                        </div>
                      ) : null}
                    </TableCell>

                    {type === "api" && apiLog ? (
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <LogLevelBadge level={log.level} />
                            <StatusCodeBadge statusCode={apiLog.statusCode} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("labels.duration")}: {formatDuration(apiLog.durationMs, tRoot)}
                          </div>
                        </div>
                      </TableCell>
                    ) : null}

                    {type === "audit" && auditLog ? (
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <LogLevelBadge level={log.level} />
                          <div className="text-xs text-muted-foreground">
                            {t("labels.source")}: {auditLog.source || tRoot("shared.empty_value")}
                          </div>
                        </div>
                      </TableCell>
                    ) : null}

                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="font-medium">{getUserLogLabel(log, tRoot)}</div>
                        <div className="text-xs text-muted-foreground">{t("labels.ip")}: {log.ip || tRoot("shared.empty_value")}</div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <OriginBadge origin={log.clientOrigin} />
                    </TableCell>

                    <TableCell className="max-w-[360px] align-top">
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {log.message || tRoot("shared.empty_value")}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap align-top">
                      {formatLogDateTime(log.createdAt, locale)}
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{t("actions.open")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedLog(log)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("actions.view_details")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {isLoading ? t("loading") : t("empty.no_results")}
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
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <LogDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        type={type}
        log={selectedLog}
      />
    </>
  )
}
