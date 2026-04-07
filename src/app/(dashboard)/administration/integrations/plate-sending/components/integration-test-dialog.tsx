"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Activity, PlugZap, Radio, Unplug } from "lucide-react"
import { useTranslator } from "@/lib/i18n"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Integration, IntegrationCameraBinding, IntegrationRealtimeLogLine, IntegrationRealtimeRawPayload } from "@/types/integration"
import {
  getAuthTokenForRealtime,
  getRealtimeEventName,
  getRealtimeLogColor,
  getSocketBaseUrl,
} from "./utils"

interface IntegrationWebhookEvent {
  cameraId: number
  timestamp: string
  type?: string
  data: {
    step?: string
    plate?: string
    plateText?: string
    confidence?: number
    message?: string
    rawPayload?: unknown
    detectionId?: string | number
    payload?: unknown
    vehicle?: {
      VehicleColor?: string
      VehicleType?: string
    }
    snapInfo?: {
      DeviceID?: string
    }
  }
}

interface IntegrationTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  binding: IntegrationCameraBinding | null
}

function formatTime() {
  return new Date().toTimeString().split(" ")[0] || ""
}

export function IntegrationTestDialog({
  open,
  onOpenChange,
  integration,
  binding,
}: IntegrationTestDialogProps) {
  const t = useTranslator("plate_sending")
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const filterCameraIdRef = useRef("")

  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [listening, setListening] = useState(false)
  const [consoleTab, setConsoleTab] = useState("events")
  const [filterCameraId, setFilterCameraId] = useState("")
  const [logs, setLogs] = useState<IntegrationRealtimeLogLine[]>([])
  const [rawPayloads, setRawPayloads] = useState<IntegrationRealtimeRawPayload[]>([])

  useEffect(() => {
    filterCameraIdRef.current = filterCameraId
  }, [filterCameraId])

  useEffect(() => {
    if (!terminalRef.current) return
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    if (open) return

    socketRef.current?.disconnect()
    socketRef.current = null
    setConnected(false)
    setConnecting(false)
    setListening(false)
    setFilterCameraId("")
    setLogs([])
    setRawPayloads([])
    setConsoleTab("events")
  }, [open])

  const addLog = useCallback((message: string, type: IntegrationRealtimeLogLine["type"] = "info") => {
    setLogs((previous) => [
      ...previous,
      {
        time: formatTime(),
        message,
        type,
      },
    ])
  }, [])

  const shouldIgnoreCamera = useCallback((cameraId: number) => {
    const currentFilter = filterCameraIdRef.current.trim()
    return currentFilter ? String(cameraId) !== String(currentFilter) : false
  }, [])

  const handleWebhookEvent = useCallback((event: IntegrationWebhookEvent) => {
    const { data, timestamp, cameraId } = event
    const time = new Date(timestamp).toLocaleTimeString("pt-BR")

    if (shouldIgnoreCamera(cameraId)) return

    if (data.step === "received") {
      if (data.rawPayload) {
        setRawPayloads((previous) => [
          ...previous,
          { time, cameraId, payload: data.rawPayload },
        ])
      }

      addLog("───────────────────────────────────────────────────────────", "separator")
      addLog(`[${time}] ${t("test.events.received_title")}`, "header")
      if (data.plate) addLog(`   ${t("test.events.plate")}: ${data.plate}`, "success")
      if (typeof data.confidence === "number") {
        addLog(`   ${t("test.events.confidence")}: ${data.confidence}%`, "info")
      }
      if (data.vehicle?.VehicleColor) {
        addLog(`   ${t("test.events.vehicle_color")}: ${data.vehicle.VehicleColor}`, "detail")
      }
      if (data.vehicle?.VehicleType) {
        addLog(`   ${t("test.events.vehicle_type")}: ${data.vehicle.VehicleType}`, "detail")
      }
      if (data.snapInfo?.DeviceID) {
        addLog(`   ${t("test.events.device_id")}: ${data.snapInfo.DeviceID}`, "detail")
      }
      return
    }

    if (data.step === "saved") {
      addLog(`[${time}] ${t("test.events.saved_title")}`, "success")
      if (data.detectionId) {
        addLog(`   ${t("test.events.detection_id")}: ${data.detectionId}`, "success")
      }
      if (data.plateText) {
        addLog(`   ${t("test.events.plate")}: ${data.plateText}`, "info")
      }
      return
    }

    if (data.step === "ignored") {
      addLog(`[${time}] ${t("test.events.ignored_title")}`, "warning")
      if (data.plate) addLog(`   ${t("test.events.plate")}: ${data.plate}`, "warning")
      if (data.message) addLog(`   ${t("test.events.message")}: ${data.message}`, "detail")
    }
  }, [addLog, shouldIgnoreCamera, t])

  const handleIntegrationEvent = useCallback((event: IntegrationWebhookEvent) => {
    const { data, timestamp, type, cameraId } = event
    const time = new Date(timestamp).toLocaleTimeString("pt-BR")

    if (shouldIgnoreCamera(cameraId)) return

    if (data.step === "sending") {
      addLog(`[${time}] ${t("test.events.sending_title", { integration: integration.code.toUpperCase() })}`, "running")
      if (data.plateText) {
        addLog(`   ${t("test.events.plate")}: ${data.plateText}`, "info")
      }
      if (data.payload) {
        addLog(`   JSON Payload: ${JSON.stringify(data.payload, null, 2)}`, "detail")
      }
      return
    }

    if (data.step === "sent") {
      addLog(`[${time}] ${t("test.events.sent_title", { integration: integration.code.toUpperCase() })}`, "success")
      addLog("───────────────────────────────────────────────────────────", "separator")
      return
    }

    if (data.step === "error" || type === "error") {
      addLog(`[${time}] ${t("test.events.error_title", { integration: integration.code.toUpperCase() })}`, "error")
      if (data.message) {
        addLog(`   ${data.message}`, "error")
      }
      addLog("───────────────────────────────────────────────────────────", "separator")
    }
  }, [addLog, integration.code, shouldIgnoreCamera, t])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const token = getAuthTokenForRealtime()

    if (!token) {
      addLog(t("test.notifications.token_missing"), "error")
      return
    }

    setConnecting(true)
    addLog(t("test.notifications.connecting"), "info")

    const socket = io(getSocketBaseUrl(), {
      path: "/api/ws/integrations",
      transports: ["websocket", "polling"],
      auth: { token },
    })

    socket.on("connect", () => {
      setConnected(true)
      setConnecting(false)
      addLog(t("test.notifications.connected"), "success")
    })

    socket.on("integration:connected", (data: { userId: number }) => {
      addLog(t("test.notifications.authenticated", { userId: data.userId }), "success")
    })

    socket.on("integration:subscribed", (data: { cameraId: number }) => {
      setListening(true)
      addLog(t("test.notifications.monitoring", { cameraId: data.cameraId }), "success")
      addLog("", "info")
      addLog("═══════════════════════════════════════════════════════════", "separator")
      addLog(t("test.notifications.waiting_title"), "header")
      addLog(t("test.notifications.waiting_description"), "info")
      addLog("═══════════════════════════════════════════════════════════", "separator")
      addLog("", "info")
    })

    socket.on("integration:webhook-event", handleWebhookEvent)
    socket.on(getRealtimeEventName(integration.code), handleIntegrationEvent)

    socket.on("disconnect", () => {
      setConnected(false)
      setListening(false)
      setConnecting(false)
      addLog(t("test.notifications.disconnected"), "error")
    })

    socket.on("connect_error", (error: { message?: string }) => {
      setConnecting(false)
      addLog(
        t("test.notifications.connection_error", {
          message: error.message || t("shared.not_informed"),
        }),
        "error",
      )
    })

    socketRef.current = socket
  }, [addLog, handleIntegrationEvent, handleWebhookEvent, integration.code, t])

  const startListening = useCallback(() => {
    if (!socketRef.current?.connected || !binding?.cameraId) {
      addLog(t("test.notifications.start_error"), "error")
      return
    }

    addLog(t("test.notifications.subscribing", { cameraId: binding.cameraId }), "info")
    socketRef.current.emit("integration:subscribe", {
      cameraId: binding.cameraId,
    })
  }, [addLog, binding?.cameraId, t])

  const stopListening = useCallback(() => {
    if (!socketRef.current?.connected) return

    socketRef.current.emit("integration:unsubscribe")
    setListening(false)
    addLog(t("test.notifications.stopped"), "info")
  }, [addLog, t])

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnected(false)
    setListening(false)
    addLog(t("test.notifications.manual_disconnect"), "info")
  }, [addLog, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{t("test.title")}</DialogTitle>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected
                ? listening
                  ? t("test.status.listening")
                  : t("test.status.connected")
                : t("test.status.disconnected")}
            </Badge>
          </div>
          <DialogDescription>
            {t("test.description", {
              camera:
                binding?.camera?.nome ||
                t("management.camera_name_fallback", { id: binding?.cameraId || 0 }),
              integration: integration.code.toUpperCase(),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex flex-wrap gap-3">
            {!connected ? (
              <Button
                type="button"
                className="cursor-pointer"
                onClick={connect}
                disabled={connecting}
              >
                <PlugZap className="mr-2 h-4 w-4" />
                {connecting ? t("test.actions.connecting") : t("test.actions.connect")}
              </Button>
            ) : (
              <>
                {!listening ? (
                  <Button
                    type="button"
                    className="cursor-pointer"
                    onClick={startListening}
                  >
                    <Radio className="mr-2 h-4 w-4" />
                    {t("test.actions.start")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={stopListening}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    {t("test.actions.stop")}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={disconnect}
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  {t("test.actions.disconnect")}
                </Button>
              </>
            )}
          </div>

          <Input
            value={filterCameraId}
            onChange={(event) => setFilterCameraId(event.target.value)}
            placeholder={t("test.filter_placeholder")}
          />

          <Tabs value={consoleTab} onValueChange={setConsoleTab} className="min-h-0 flex-1">
            <TabsList className="mb-4">
              <TabsTrigger value="events">{t("test.tabs.events")}</TabsTrigger>
              <TabsTrigger value="raw">{t("test.tabs.raw")}</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="min-h-0 flex-1">
              <div
                ref={terminalRef}
                className="h-[420px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs"
              >
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={`${log.time}-${index}`} className="flex gap-2">
                      <span className="min-w-16 text-zinc-500">{log.time}</span>
                      <span className={getRealtimeLogColor(log.type)}>
                        {log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="italic text-zinc-500">{t("test.empty_console")}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="min-h-0 flex-1">
              <div className="h-[420px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
                {rawPayloads.length > 0 ? (
                  rawPayloads.map((payload, index) => (
                    <div
                      key={`${payload.time}-${index}`}
                      className="mb-4 border-b border-zinc-800 pb-4 last:mb-0 last:border-b-0 last:pb-0"
                    >
                      <p className="mb-2 text-zinc-500">
                        [{payload.time}] Camera ID: {payload.cameraId}
                      </p>
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(payload.payload, null, 2)}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="italic text-zinc-500">{t("test.empty_raw")}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setLogs([])
              setRawPayloads([])
            }}
          >
            {t("test.actions.clear")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t("test.actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
