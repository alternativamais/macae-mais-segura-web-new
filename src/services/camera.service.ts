import api from "@/lib/api-client"
import {
  Camera,
  CreateCameraPayload,
  UpdateCameraPayload,
  Ponto,
  Totem,
} from "@/types/camera"

const basePath = "/cameras"

export const cameraService = {
  findAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get<{ data: Camera[]; total: number }>(basePath, {
      params,
    })
    return data
  },

  findOne: async (id: number) => {
    const { data } = await api.get<Camera>(`${basePath}/${id}`)
    return data
  },

  getStats: async () => {
    const { data } = await api.get<{ total: number; active: number; inactive: number }>(`${basePath}/stats`)
    return data
  },

  create: async (payload: CreateCameraPayload) => {
    const { data } = await api.post<Camera>(basePath, payload)
    return data
  },

  update: async (id: number, payload: UpdateCameraPayload) => {
    const { data } = await api.put<Camera>(`${basePath}/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`${basePath}/${id}`)
  },

  testConnection: async (payload: { ip: string; usuario?: string; senha?: string; marca?: string }) => {
    const { data } = await api.post<{ success: boolean; pathDiscovered?: string; error?: string }>(`${basePath}/test`, payload)
    return data
  },
}

export const pontoService = {
  findAll: async () => {
    const { data } = await api.get<Ponto[]>("/pontos")
    return data
  },
}

export const totemService = {
  findAll: async () => {
    const { data } = await api.get<Totem[]>("/totens")
    return data
  },
}
