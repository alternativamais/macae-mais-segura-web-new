"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logService } from "@/services/log.service"
import {
  ApiLogRecord,
  AuditLogRecord,
  ClientOrigin,
  LogsQueryParams,
  LogType,
} from "@/types/log"
import { User } from "@/types/user"
import { LogsFilters, type LogsFilterValues } from "./components/logs-filters"
import { LogsTable } from "./components/logs-table"
import { StatCards } from "./components/stat-cards"

const initialFilters: LogsFilterValues = {
  level: "",
  userId: "",
  requestId: "",
  message: "",
  dateFrom: "",
  dateTo: "",
  clientOrigin: "",
  method: "",
  url: "",
  error: "",
  action: "",
  entity: "",
}

function buildQueryParams(
  page: number,
  pageSize: number,
  filters: LogsFilterValues
): Omit<LogsQueryParams, "type"> {
  const params: Omit<LogsQueryParams, "type"> = {
    page,
    pageSize,
  }

  if (filters.level) params.level = filters.level
  if (filters.userId) params.userId = filters.userId
  if (filters.requestId) params.requestId = filters.requestId
  if (filters.message) params.message = filters.message
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.clientOrigin) params.clientOrigin = filters.clientOrigin as ClientOrigin
  if (filters.method) params.method = filters.method
  if (filters.url) params.url = filters.url
  if (filters.error) params.error = filters.error
  if (filters.action) params.action = filters.action
  if (filters.entity) params.entity = filters.entity

  return params
}

export default function LogsPage() {
  const t = useTranslator("logs")
  const [type, setType] = useState<LogType>("api")
  const [users, setUsers] = useState<User[]>([])
  const [draftFilters, setDraftFilters] = useState<LogsFilterValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<LogsFilterValues>(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [apiLogs, setApiLogs] = useState<ApiLogRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [total, setTotal] = useState(0)

  const loadUsers = useCallback(async () => {
    try {
      const data = await logService.listUsers()
      setUsers(data)
    } catch (error) {
      toast.apiError(error, t("notifications.load_users_error"))
      setUsers([])
    }
  }, [t])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const params = useMemo(
    () => buildQueryParams(page, pageSize, appliedFilters),
    [page, pageSize, appliedFilters]
  )

  const loadLogs = useCallback(async () => {
    setIsLoading(true)

    try {
      if (type === "api") {
        const response = await logService.listApiLogs(params)
        setApiLogs(response.items)
        setTotal(response.total)
      } else {
        const response = await logService.listAuditLogs(params)
        setAuditLogs(response.items)
        setTotal(response.total)
      }
    } catch (error) {
      toast.apiError(error, t("notifications.load_logs_error"))
      setApiLogs([])
      setAuditLogs([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [params, t, type])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters(draftFilters)
  }

  const handleClearFilters = () => {
    setPage(1)
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const handleTypeChange = (nextType: string) => {
    setType(nextType as LogType)
    setPage(1)
  }

  return (
    <ScreenGuard screenKey="admin.logs">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <StatCards />

          <Tabs value={type} onValueChange={handleTypeChange} className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="api">{t("tabs.api")}</TabsTrigger>
              <TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="mt-4 space-y-4">
              <LogsFilters
                type="api"
                filters={draftFilters}
                users={users}
                onChange={(field, value) =>
                  setDraftFilters((prev) => ({ ...prev, [field]: value }))
                }
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
              <LogsTable
                type="api"
                logs={apiLogs}
                total={type === "api" ? total : 0}
                isLoading={isLoading && type === "api"}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </TabsContent>

            <TabsContent value="audit" className="mt-4 space-y-4">
              <LogsFilters
                type="audit"
                filters={draftFilters}
                users={users}
                onChange={(field, value) =>
                  setDraftFilters((prev) => ({ ...prev, [field]: value }))
                }
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
              <LogsTable
                type="audit"
                logs={auditLogs}
                total={type === "audit" ? total : 0}
                isLoading={isLoading && type === "audit"}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
