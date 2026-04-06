import api from "@/lib/api-client"
import {
  CreateTotemPayload,
  Totem,
  TotemCallCenterExtension,
  TotemListParams,
  TotemListResponse,
  UpdateTotemPayload,
} from "@/types/totem"

const basePath = "/totens"
const FETCH_PAGE_SIZE = 100

export const totemService = {
  findAll: async (params?: TotemListParams) => {
    const { data } = await api.get<TotemListResponse>(basePath, {
      params,
    })

    return data
  },

  findAllNoPagination: async (params?: Omit<TotemListParams, "page" | "limit">) => {
    const firstPage = await totemService.findAll({
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
        totemService.findAll({
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
    const { data } = await api.get<Totem>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreateTotemPayload) => {
    const { data } = await api.post<Totem>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateTotemPayload) => {
    const { data } = await api.put<Totem>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },

  listCallCenterExtensions: async () => {
    const { data } = await api.get<TotemCallCenterExtension[]>(`${basePath}/call-center/extensions`)
    return data
  },
}
