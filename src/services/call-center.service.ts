import api from "@/lib/api-client"
import {
  CallCenterAgentSession,
  CallCenterCall,
  CallCenterLogEntry,
} from "@/types/call-center"

export const callCenterService = {
  listActiveCalls: async (limit = 80) => {
    const { data } = await api.get<CallCenterCall[]>("/call-center/calls/active", {
      params: { limit },
    })
    return data
  },

  listLogs: async (limit = 200) => {
    const { data } = await api.get<CallCenterLogEntry[]>("/call-center/logs", {
      params: { limit },
    })
    return data
  },

  getMyAgentSession: async () => {
    const { data } = await api.get<CallCenterAgentSession | null>("/call-center/agent-session/me")
    return data
  },

  activateAgentSession: async (extension: string) => {
    const { data } = await api.post<CallCenterAgentSession>("/call-center/agent-session/login", {
      extension,
    })
    return data
  },

  logoutAgentSession: async () => {
    const { data } = await api.post<CallCenterAgentSession | null>("/call-center/agent-session/logout")
    return data
  },
}
