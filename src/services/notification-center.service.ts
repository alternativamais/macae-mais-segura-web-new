import api from "@/lib/api-client"
import {
  NotificationDetails,
  NotificationDispatchResult,
  NotificationHistoryResponse,
  NotificationLocality,
  NotificationLocalityPayload,
  NotificationPreview,
  NotificationSendPayload,
  NotificationUserApp,
} from "@/types/notification-center"

export const notificationCenterService = {
  send: async (payload: NotificationSendPayload) => {
    const { data } = await api.post<NotificationDispatchResult>("/notifications", payload)
    return data
  },

  preview: async (payload: NotificationSendPayload) => {
    const { data } = await api.post<NotificationPreview>("/notifications/preview", payload)
    return data
  },

  listHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get<NotificationHistoryResponse>("/notifications", {
      params: { page, limit },
    })
    return data
  },

  getDetails: async (id: number) => {
    const { data } = await api.get<NotificationDetails>(`/notifications/${id}`)
    return data
  },

  listLocalities: async () => {
    const { data } = await api.get<NotificationLocality[]>("/notification-localities")
    return data
  },

  createLocality: async (payload: NotificationLocalityPayload) => {
    const { data } = await api.post<NotificationLocality>("/notification-localities", payload)
    return data
  },

  updateLocality: async (id: number, payload: Partial<NotificationLocalityPayload>) => {
    const { data } = await api.put<NotificationLocality>(`/notification-localities/${id}`, payload)
    return data
  },

  deleteLocality: async (id: number) => {
    await api.delete(`/notification-localities/${id}`)
  },

  listUsersApp: async () => {
    const { data } = await api.get<NotificationUserApp[]>("/users-app")
    return data
  },
}
