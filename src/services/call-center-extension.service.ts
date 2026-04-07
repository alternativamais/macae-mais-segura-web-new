import api from "@/lib/api-client"
import {
  CallCenterExtension,
  CallCenterExtensionPayload,
  CallCenterExtensionsResponse,
  CallCenterExtensionType,
} from "@/types/call-center-extension"

interface FindAllParams {
  page?: number
  limit?: number
  search?: string
  type?: CallCenterExtensionType
}

export const callCenterExtensionService = {
  findAll: async (params: FindAllParams = {}) => {
    const { data } = await api.get<CallCenterExtensionsResponse>("/call-center/extensions", {
      params,
    })

    return data
  },

  findAllNoPagination: async (params: Omit<FindAllParams, "page" | "limit"> = {}) => {
    const limit = 100
    const firstPage = await callCenterExtensionService.findAll({
      ...params,
      page: 1,
      limit,
    })

    const totalPages = Math.max(1, Math.ceil((firstPage.total || 0) / limit))

    if (totalPages === 1) {
      return firstPage.data || []
    }

    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        callCenterExtensionService.findAll({
          ...params,
          page: index + 2,
          limit,
        }),
      ),
    )

    return [
      ...(firstPage.data || []),
      ...remaining.flatMap((response) => response.data || []),
    ]
  },

  create: async (payload: CallCenterExtensionPayload) => {
    const { data } = await api.post<CallCenterExtension>("/call-center/extensions", payload)
    return data
  },

  update: async (id: number, payload: Partial<CallCenterExtensionPayload>) => {
    const { data } = await api.put<CallCenterExtension>(`/call-center/extensions/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/call-center/extensions/${id}`)
    return data
  },
}
