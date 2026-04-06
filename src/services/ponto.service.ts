import api from "@/lib/api-client"
import {
  CreatePointPayload,
  PointListParams,
  PointListResponse,
  Ponto,
  UpdatePointPayload,
} from "@/types/ponto"

const basePath = "/pontos"
const FETCH_PAGE_SIZE = 100

export const pontoService = {
  findAll: async (params?: PointListParams) => {
    const { data } = await api.get<PointListResponse>(basePath, {
      params,
    })

    return data
  },

  findAllNoPagination: async (params?: Omit<PointListParams, "page" | "limit">) => {
    const firstPage = await pontoService.findAll({
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
        pontoService.findAll({
          ...params,
          page: index + 2,
          limit: FETCH_PAGE_SIZE,
        })
      )
    )

    return [
      ...firstPage.data,
      ...remainingPages.flatMap((response) => response.data),
    ]
  },

  findOne: async (id: number) => {
    const { data } = await api.get<Ponto>(`${basePath}/${id}`)
    return data
  },

  create: async (payload: CreatePointPayload) => {
    const { data } = await api.post<Ponto>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdatePointPayload) => {
    const { data } = await api.put<Ponto>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },
}
