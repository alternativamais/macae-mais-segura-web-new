import api from "@/lib/api-client"
import {
  CreateDashboardWidgetPayload,
  DashboardWidget,
  DashboardWidgetListParams,
  DashboardWidgetRuntimeParams,
  DashboardWidgetRuntime,
  UpdateDashboardWidgetPayload,
} from "@/types/dashboard-widget"

const basePath = "/dashboard-widgets"

export const dashboardWidgetService = {
  list: async (params?: DashboardWidgetListParams) => {
    const { data } = await api.get<DashboardWidget[]>(basePath, { params })
    return Array.isArray(data) ? data : []
  },

  listDashboard: async (params?: DashboardWidgetRuntimeParams) => {
    const { data } = await api.get<DashboardWidgetRuntime[]>(`${basePath}/dashboard`, {
      params,
    })
    return Array.isArray(data) ? data : []
  },

  preview: async (payload: CreateDashboardWidgetPayload) => {
    const { data } = await api.post<DashboardWidgetRuntime>(`${basePath}/preview`, payload)
    return data
  },

  findOne: async (id: number) => {
    const { data } = await api.get<DashboardWidget>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreateDashboardWidgetPayload) => {
    const { data } = await api.post<DashboardWidget>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateDashboardWidgetPayload) => {
    const { data } = await api.put<DashboardWidget>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },
}
