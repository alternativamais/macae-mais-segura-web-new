"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Eye, RefreshCcw } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { useHasPermission } from "@/hooks/use-has-permission"
import { callCenterExtensionService } from "@/services/call-center-extension.service"
import { callCenterService } from "@/services/call-center.service"
import { CallCenterAgentSession, CallCenterCall, CallCenterLogEntry } from "@/types/call-center"
import { CallCenterExtension } from "@/types/call-center-extension"
import { format } from "date-fns"
import { HistoryDialog } from "./history-dialog"
import { SessionCard } from "./session-card"
import { StatCards } from "./stat-cards"
import { CallCenterStatusBadge } from "./status-badges"
import {
  CALL_CENTER_STATUS_META,
  getLogTone,
  getRealtimeToken,
  getSocketBaseUrl,
  resolveCallDuration,
  sortCalls,
} from "./utils"

const STATUS_FILTERS = ["all", ...Object.keys(CALL_CENTER_STATUS_META)]

export function CallCenterTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("call_center")
  const socketRef = useRef<Socket | null>(null)

  const canView = hasPermission("visualizar_central_atendimento")
  const canManageSession = hasPermission("assumir_ramal_central")

  const [calls, setCalls] = useState<CallCenterCall[]>([])
  const [logs, setLogs] = useState<CallCenterLogEntry[]>([])
  const [operatorExtensions, setOperatorExtensions] = useState<CallCenterExtension[]>([])
  const [session, setSession] = useState<CallCenterAgentSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [filter, setFilter] = useState("all")
  const [tick, setTick] = useState(0)
  const [historyCall, setHistoryCall] = useState<CallCenterCall | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("calls")

  const loadCalls = useCallback(async () => {
    if (!canView) return
    setIsLoading(true)
    try {
      const data = await callCenterService.listActiveCalls(80)
      setCalls(Array.isArray(data) ? sortCalls(data) : [])
    } catch (error) {
      toast.apiError(error, t("notifications.load_error"))
      setCalls([])
    } finally {
      setIsLoading(false)
    }
  }, [canView, t])

  const loadSessionDependencies = useCallback(async () => {
    if (!canManageSession) return
    try {
      const [currentSession, extensions] = await Promise.all([
        callCenterService.getMyAgentSession(),
        callCenterExtensionService.findAllNoPagination({ type: "operator" }),
      ])
      setSession(currentSession)
      setOperatorExtensions(extensions)
    } catch (error) {
      toast.apiError(error, t("notifications.session_error"))
      setSession(null)
      setOperatorExtensions([])
    }
  }, [canManageSession, t])

  const loadLogs = useCallback(async () => {
    if (!canView) return
    setIsLoadingLogs(true)
    try {
      const data = await callCenterService.listLogs(200)
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.apiError(error, t("notifications.logs_error"))
      setLogs([])
    } finally {
      setIsLoadingLogs(false)
    }
  }, [canView, t])

  useEffect(() => {
    if (canView) {
      loadCalls()
      loadLogs()
    }
    if (canManageSession) {
      loadSessionDependencies()
    }
  }, [canManageSession, canView, loadCalls, loadLogs, loadSessionDependencies])

  useEffect(() => {
    if (!canView) return
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [canView])

  useEffect(() => {
    if (!canView) return
    const timer = window.setInterval(() => {
      loadCalls()
    }, 60000)
    return () => window.clearInterval(timer)
  }, [canView, loadCalls])

  useEffect(() => {
    if (!canView) return
    const token = getRealtimeToken()
    if (!token) return

    const socket = io(getSocketBaseUrl(), {
      path: "/api/ws/call-center",
      transports: ["websocket"],
      auth: { token },
    })

    socket.on("call-center:calls-snapshot", (payload: CallCenterCall[]) => {
      if (Array.isArray(payload)) {
        setCalls(sortCalls(payload))
      }
    })

    socket.on("call-center:call-updated", (call: CallCenterCall) => {
      if (!call?.id) return
      setCalls((previous) => {
        const list = [...previous]
        const index = list.findIndex((item) => item.id === call.id)
        if (index >= 0) {
          list[index] = call
        } else {
          list.unshift(call)
        }
        return sortCalls(list).slice(0, 120)
      })
      setHistoryCall((previous) => (previous?.id === call.id ? call : previous))
    })

    socketRef.current = socket
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [canView])

  const filteredCalls = useMemo(() => {
    if (filter === "all") return calls
    return calls.filter((call) => call.status === filter)
  }, [calls, filter])

  const counters = useMemo(() => {
    const base: Record<string, number> = { total: calls.length }
    calls.forEach((call) => {
      base[call.status] = (base[call.status] || 0) + 1
    })
    return base
  }, [calls])

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">
          {t("permission_denied")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <StatCards calls={calls} isLoading={isLoading} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SessionCard
          session={session}
          extensions={operatorExtensions}
          canManageSession={canManageSession}
          isLoading={isLoading}
          onSessionChange={setSession}
        />

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("monitor.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("monitor.description")}</p>
            </div>
            <Button
              variant="outline"
              onClick={loadCalls}
              disabled={isLoading}
              className="w-full cursor-pointer sm:w-auto"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("monitor.refresh")}
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4 overflow-x-hidden">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setFilter(status)}
                >
                  {status === "all"
                    ? t("monitor.filters.all", { count: counters.total || 0 })
                    : t(CALL_CENTER_STATUS_META[status].labelKey, {
                        count: counters[status] || 0,
                      })}
                </Button>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calls" className="cursor-pointer">
                  {t("tabs.calls")}
                </TabsTrigger>
                <TabsTrigger value="logs" className="cursor-pointer">
                  {t("tabs.logs")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="space-y-4">
                <div className="relative min-w-0 overflow-hidden rounded-md border bg-card">
                  {isLoading ? <TableLoadingOverlay /> : null}
                  <Table className="min-w-[920px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.columns.queue")}</TableHead>
                        <TableHead>{t("table.columns.origin")}</TableHead>
                        <TableHead>{t("table.columns.agent")}</TableHead>
                        <TableHead>{t("table.columns.status")}</TableHead>
                        <TableHead>{t("table.columns.start")}</TableHead>
                        <TableHead>{t("table.columns.answered")}</TableHead>
                        <TableHead>{t("table.columns.end")}</TableHead>
                        <TableHead>{t("table.columns.duration")}</TableHead>
                        <TableHead className="w-[70px] text-right">{t("table.columns.history")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.length > 0 ? (
                        filteredCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{call.queueName || "-"}</div>
                                <div className="text-xs text-muted-foreground">#{call.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{call.totem?.numero || call.fromRamal || "-"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {call.totem?.pontoDeReferencia || call.fromChannel || "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{call.agent?.name || "-"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {call.toRamal ? t("table.extension", { extension: call.toRamal }) : "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <CallCenterStatusBadge status={call.status} />
                            </TableCell>
                            <TableCell>{call.ringingAt ? format(new Date(call.ringingAt), "HH:mm:ss") : "-"}</TableCell>
                            <TableCell>{call.answeredAt ? format(new Date(call.answeredAt), "HH:mm:ss") : "-"}</TableCell>
                            <TableCell>{call.endedAt ? format(new Date(call.endedAt), "HH:mm:ss") : "-"}</TableCell>
                            <TableCell>{resolveCallDuration(call, new Date(Date.now() + tick))}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() => {
                                  setHistoryCall(call)
                                  setIsHistoryOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            {isLoading ? t("loading") : t("table.empty")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={loadLogs}
                    disabled={isLoadingLogs}
                    className="w-full cursor-pointer sm:w-auto"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {t("logs.refresh")}
                  </Button>
                </div>
                <div className="rounded-md border bg-card">
                  <div className="max-h-[480px] overflow-y-auto p-4">
                    {logs.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        {isLoadingLogs ? t("logs.loading") : t("logs.empty")}
                      </div>
                    ) : (
                      <div className="space-y-3 font-mono text-xs">
                        {logs.map((entry, index) => (
                          <div key={`${entry.timestamp}-${index}`} className="rounded-md border bg-muted/20 p-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className={getLogTone(entry.level)}>
                                [{format(new Date(entry.timestamp), "HH:mm:ss")}] {entry.source}
                              </span>
                              <Badge variant="outline">{entry.level || "info"}</Badge>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                              {entry.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <HistoryDialog call={historyCall} open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
    </div>
  )
}
