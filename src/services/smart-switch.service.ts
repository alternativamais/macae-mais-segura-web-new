import api from "@/lib/api-client"
import {
  CreateSmartSwitchPayload,
  HomeAssistantSwitchEntity,
  SmartSwitch,
  SmartSwitchListParams,
  SmartSwitchListResponse,
  SmartSwitchPowerResponse,
  UpdateSmartSwitchPayload,
} from "@/types/smart-switch"

const basePath = "/smart-switches"
const FETCH_PAGE_SIZE = 100

export const smartSwitchService = {
  findAll: async (params?: SmartSwitchListParams) => {
    const { data } = await api.get<SmartSwitchListResponse>(basePath, {
      params,
    })

    return data
  },

  findAllNoPagination: async (
    params?: Omit<SmartSwitchListParams, "page" | "limit">,
  ) => {
    const firstPage = await smartSwitchService.findAll({
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
        smartSwitchService.findAll({
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
    const { data } = await api.get<SmartSwitch>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreateSmartSwitchPayload) => {
    const { data } = await api.post<SmartSwitch>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateSmartSwitchPayload) => {
    const { data } = await api.put<SmartSwitch>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },

  listAssignableHomeAssistantEntities: async (currentId?: number, empresaId?: number) => {
    const { data } = await api.get<HomeAssistantSwitchEntity[]>(
      `${basePath}/home-assistant/entities`,
      {
        params: {
          ...(currentId ? { currentId } : {}),
          ...(empresaId ? { empresaId } : {}),
        },
      },
    )

    return data
  },

  getPowerState: async (id: number) => {
    const { data } = await api.get<SmartSwitchPowerResponse>(`${basePath}/${id}/state`)
    return data
  },

  togglePower: async (id: number) => {
    const { data } = await api.post<SmartSwitchPowerResponse>(`${basePath}/${id}/toggle`)
    return data
  },
}
