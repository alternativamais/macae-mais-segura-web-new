import { AUTH_TOKEN_KEY } from "@/lib/auth-session"
import { useAuthStore } from "@/store/auth-store"
import { CallCenterCall, CallCenterHistoryEntry, CallCenterLogEntry } from "@/types/call-center"
import { differenceInSeconds } from "date-fns"

export const CALL_CENTER_STATUS_META: Record<string, { labelKey: string; tone: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  ringing: { labelKey: "status.ringing", tone: "warning" },
  answered: { labelKey: "status.answered", tone: "success" },
  completed: { labelKey: "status.completed", tone: "secondary" },
  abandoned: { labelKey: "status.abandoned", tone: "destructive" },
}

export const CALL_CENTER_HISTORY_LABELS: Record<string, string> = {
  queue_join: "history.queue_join",
  queue_rejoin: "history.queue_rejoin",
  queue_abandon: "history.queue_abandon",
  agent_called: "history.agent_called",
  agent_connect: "history.agent_connect",
  agent_ring_noanswer: "history.agent_ring_noanswer",
  agent_missed: "history.agent_missed",
  agent_complete: "history.agent_complete",
  caller_abandon: "history.caller_abandon",
  channel_hangup: "history.channel_hangup",
}

export function sortCalls(list: CallCenterCall[]) {
  return [...list].sort((a, b) => {
    const dateA = new Date(a.ringingAt || a.answeredAt || a.endedAt || 0).getTime()
    const dateB = new Date(b.ringingAt || b.answeredAt || b.endedAt || 0).getTime()
    return dateB - dateA
  })
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null) return "-"
  const total = Math.max(0, Math.floor(seconds))
  const hrs = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const parts = [hrs, mins, secs].map((unit) => String(unit).padStart(2, "0"))
  return hrs ? parts.join(":") : parts.slice(1).join(":")
}

export function resolveCallDuration(call: CallCenterCall, now = new Date()) {
  if (call.status === "answered" && call.answeredAt && !call.endedAt) {
    return formatDuration(differenceInSeconds(now, new Date(call.answeredAt)))
  }
  if (call.status === "ringing" && call.ringingAt && !call.answeredAt) {
    return formatDuration(differenceInSeconds(now, new Date(call.ringingAt)))
  }
  if (call.duracaoSegundos != null) {
    return formatDuration(call.duracaoSegundos)
  }
  if (call.answeredAt && call.endedAt) {
    return formatDuration(
      differenceInSeconds(new Date(call.endedAt), new Date(call.answeredAt)),
    )
  }
  return "-"
}

export function getSocketBaseUrl() {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001/api/"
  try {
    return new URL(baseURL).origin
  } catch {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return "http://localhost:6001"
  }
}

export function getRealtimeToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("@macaemaissegura:token")
}

export function getRealtimeSocketAuth() {
  const token = getRealtimeToken()
  if (!token) return null

  const { activeCompanyId } = useAuthStore.getState()

  return {
    token,
    ...(activeCompanyId ? { empresaId: String(activeCompanyId) } : {}),
  }
}

export function getHistoryEntryLabel(entry: CallCenterHistoryEntry) {
  return CALL_CENTER_HISTORY_LABELS[entry.eventType] || entry.eventType
}

export function getLogTone(level?: CallCenterLogEntry["level"]) {
  switch (level) {
    case "error":
      return "text-destructive"
    case "warn":
      return "text-amber-500"
    default:
      return "text-muted-foreground"
  }
}
