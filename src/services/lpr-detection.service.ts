import api from "@/lib/api-client"
import {
  DeleteLprDetectionsBatchPayload,
  LprDetection,
  LprDetectionFilters,
  LprDetectionListResponse,
  UpdateLprDetectionPayload,
} from "@/types/lpr-detection"

const basePath = "/integrations/lpr/detections"

export const lprDetectionService = {
  findAll: async (params: LprDetectionFilters) => {
    const { data } = await api.get<LprDetectionListResponse>(basePath, { params })
    return data
  },

  findOne: async (id: number) => {
    const { data } = await api.get<LprDetection>(`${basePath}/${id}`)
    return data
  },

  update: async (id: number, payload: UpdateLprDetectionPayload) => {
    const { data } = await api.put<LprDetection>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },

  deleteBatch: async (payload: DeleteLprDetectionsBatchPayload) => {
    const { data } = await api.delete<{ count: number }>(`${basePath}/batch`, {
      data: payload,
    })
    return data
  },
}
