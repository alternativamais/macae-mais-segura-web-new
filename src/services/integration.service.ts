import api from "@/lib/api-client"
import {
  Integration,
  IntegrationCameraDetails,
  IntegrationCameraMutationPayload,
  IntegrationGeneratedToken,
  IntegrationLogsResponse,
} from "@/types/integration"

export const integrationService = {
  listIntegrations: async () => {
    const { data } = await api.get<Integration[]>("/integrations")
    return Array.isArray(data) ? data : []
  },

  getIntegrationByCode: async (code: string) => {
    const { data } = await api.get<Integration>(`/integrations/${code}`)
    return data
  },

  getIntegrationCameraDetails: async (code: string) => {
    const { data } = await api.get<IntegrationCameraDetails>(
      `/integrations/${code}/cameras`,
    )
    return data
  },

  listCameras: async (code: string) => {
    const { data } = await api.get<IntegrationCameraDetails>(
      `/integrations/${code}/cameras`,
    )
    return data
  },

  addCamera: async (
    code: string,
    cameraId: number,
    payload: IntegrationCameraMutationPayload,
  ) => {
    const { data } = await api.post(
      `/integrations/${code}/cameras/${cameraId}`,
      payload,
    )
    return data
  },

  updateCamera: async (
    code: string,
    cameraId: number,
    payload: IntegrationCameraMutationPayload,
  ) => {
    const { data } = await api.patch(
      `/integrations/${code}/cameras/${cameraId}`,
      payload,
    )
    return data
  },

  removeCamera: async (code: string, cameraId: number) => {
    const { data } = await api.delete(`/integrations/${code}/cameras/${cameraId}`)
    return data
  },

  listTokens: async (code: string, cameraId: number) => {
    const { data } = await api.get(
      `/integrations/${code}/cameras/${cameraId}/tokens`,
    )
    return Array.isArray(data) ? data : []
  },

  generateToken: async (code: string, cameraId: number) => {
    const { data } = await api.post<IntegrationGeneratedToken>(
      `/integrations/${code}/cameras/${cameraId}/token`,
    )
    return data
  },

  revokeToken: async (code: string, cameraId: number, tokenId: number) => {
    const { data } = await api.delete(
      `/integrations/${code}/cameras/${cameraId}/token/${tokenId}`,
    )
    return data
  },

  listLogs: async (
    code: string,
    integrationCameraId: number,
    page = 1,
    limit = 20,
  ) => {
    const { data } = await api.get<IntegrationLogsResponse>(
      `/integrations/${code}/cameras/${integrationCameraId}/logs?page=${page}&limit=${limit}`,
    )

    return data
  },
}
