import api from "@/lib/api-client"
import {
  CreateNetworkEquipmentPayload,
  NetworkEquipment,
  NetworkEquipmentListParams,
  NetworkEquipmentListResponse,
  UpdateNetworkEquipmentPayload,
} from "@/types/network-equipment"

const basePath = "/equipamentos-rede"
const FETCH_PAGE_SIZE = 100

export const networkEquipmentService = {
  findAll: async (params?: NetworkEquipmentListParams) => {
    const { data } = await api.get<NetworkEquipmentListResponse>(basePath, {
      params,
    })

    return data
  },

  findAllNoPagination: async (
    params?: Omit<NetworkEquipmentListParams, "page" | "limit">,
  ) => {
    const firstPage = await networkEquipmentService.findAll({
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
        networkEquipmentService.findAll({
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
    const { data } = await api.get<NetworkEquipment>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreateNetworkEquipmentPayload) => {
    const { data } = await api.post<NetworkEquipment>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateNetworkEquipmentPayload) => {
    const { data } = await api.put<NetworkEquipment>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },
}
