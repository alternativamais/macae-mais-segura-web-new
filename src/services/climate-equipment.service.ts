import api from "@/lib/api-client"
import {
  ClimateDashboardParams,
  ClimateDashboardResponse,
  ClimateEquipment,
  ClimateEquipmentListParams,
  ClimateEquipmentListResponse,
  ClimateSensorHistoryEntry,
  ClimateTotemDashboardResponse,
  ClimateTotemOption,
  CreateClimateEquipmentPayload,
  HomeAssistantClimateDeviceOption,
  UpdateClimateEquipmentPayload,
} from "@/types/climate-equipment"

const basePath = "/climate-equipments"
const FETCH_PAGE_SIZE = 100

export const climateEquipmentService = {
  findAll: async (params?: ClimateEquipmentListParams) => {
    const { data } = await api.get<ClimateEquipmentListResponse>(basePath, {
      params,
    })

    return data
  },

  findAllNoPagination: async (
    params?: Omit<ClimateEquipmentListParams, "page" | "limit">,
  ) => {
    const firstPage = await climateEquipmentService.findAll({
      ...params,
      page: 1,
      limit: FETCH_PAGE_SIZE,
    })

    const totalPages = Math.max(1, Math.ceil(firstPage.total / FETCH_PAGE_SIZE))

    if (totalPages === 1) {
      return firstPage.data
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        climateEquipmentService.findAll({
          ...params,
          page: index + 2,
          limit: FETCH_PAGE_SIZE,
        }),
      ),
    )

    return [
      ...firstPage.data,
      ...remainingPages.flatMap((response) => response.data),
    ]
  },

  findOne: async (id: number) => {
    const { data } = await api.get<ClimateEquipment>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreateClimateEquipmentPayload) => {
    const { data } = await api.post<ClimateEquipment>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateClimateEquipmentPayload) => {
    const { data } = await api.put<ClimateEquipment>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },

  listHomeAssistantDevices: async (empresaId?: number) => {
    const { data } = await api.get<HomeAssistantClimateDeviceOption[]>(
      `${basePath}/home-assistant/devices`,
      {
        params: empresaId ? { empresaId } : undefined,
      },
    )

    return data
  },

  listTotemOptions: async (empresaId?: number) => {
    const { data } = await api.get<ClimateTotemOption[]>(`${basePath}/totems`, {
      params: empresaId ? { empresaId } : undefined,
    })
    return data
  },

  sync: async (id: number) => {
    const { data } = await api.post<ClimateEquipment>(`${basePath}/${id}/sync`)
    return data
  },

  getDashboard: async (id: number, params?: ClimateDashboardParams) => {
    const { data } = await api.get<ClimateDashboardResponse>(`${basePath}/${id}/dashboard`, {
      params,
    })

    return data
  },

  getTotemDashboard: async (totemId: number, params?: ClimateDashboardParams) => {
    const { data } = await api.get<ClimateTotemDashboardResponse>(
      `${basePath}/totems/${totemId}/dashboard`,
      {
        params,
      },
    )

    return data
  },

  getSensorHistory: async (
    id: number,
    sensorType: string,
    params?: ClimateDashboardParams & { limit?: number },
  ) => {
    const { data } = await api.get<ClimateSensorHistoryEntry[]>(`${basePath}/${id}/history`, {
      params: {
        sensorType,
        ...params,
      },
    })

    return data
  },
}
