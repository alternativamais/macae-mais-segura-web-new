import api from "@/lib/api-client"
import { User } from "@/types/user"
import {
  ApiLogRecord,
  AuditLogRecord,
  LogsListResponse,
  LogsQueryParams,
} from "@/types/log"

export const logService = {
  listApiLogs: async (
    params: Omit<LogsQueryParams, "type">
  ): Promise<LogsListResponse<ApiLogRecord>> => {
    const { data } = await api.get<LogsListResponse<ApiLogRecord>>("/logs", {
      params: { ...params, type: "api" },
    })
    return data
  },

  listAuditLogs: async (
    params: Omit<LogsQueryParams, "type">
  ): Promise<LogsListResponse<AuditLogRecord>> => {
    const { data } = await api.get<LogsListResponse<AuditLogRecord>>("/logs", {
      params: { ...params, type: "audit" },
    })
    return data
  },

  listUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>("/logs/users")
    return data
  },
}
