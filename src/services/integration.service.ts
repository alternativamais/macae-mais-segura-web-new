import api from "@/lib/api-client"
import {
  Integration,
  IntegrationCameraDetails,
  IntegrationCameraMutationPayload,
  IntegrationGeneratedToken,
  IntegrationLogDetail,
  IntegrationLogsResponse,
  IntegrationMutationPayload,
  PlateCameraConfig,
  PlateCameraConfigPreset,
  PlateCameraConfigPresetMutationPayload,
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

  createIntegration: async (payload: IntegrationMutationPayload) => {
    const { data } = await api.post<Integration>("/integrations", payload)
    return data
  },

  updateIntegration: async (code: string, payload: Partial<IntegrationMutationPayload>) => {
    const { data } = await api.patch<Integration>(`/integrations/${code}`, payload)
    return data
  },

  removeIntegration: async (code: string) => {
    const { data } = await api.delete(`/integrations/${code}`)
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

  getLogDetails: async (
    code: string,
    integrationCameraId: number,
    logId: number,
  ) => {
    const { data } = await api.get<IntegrationLogDetail>(
      `/integrations/${code}/cameras/${integrationCameraId}/logs/${logId}`,
    )

    return data
  },

  getPlateCameraConfig: async (cameraId: number) => {
    const { data } = await api.get<PlateCameraConfig>(
      `/integrations/plate-camera-configs/${cameraId}`,
    )
    return data
  },

  updatePlateCameraConfig: async (
    cameraId: number,
    payload: {
      enabled?: boolean
      saveMapping?: string
    },
  ) => {
    const { data } = await api.patch<PlateCameraConfig>(
      `/integrations/plate-camera-configs/${cameraId}`,
      payload,
    )
    return data
  },

  armPlateCameraCapture: async (cameraId: number) => {
    const { data } = await api.post(
      `/integrations/plate-camera-configs/${cameraId}/arm-capture`,
    )
    return data
  },

  listPresets: async () => {
    const { data } = await api.get<PlateCameraConfigPreset[]>(
      "/integrations/plate-camera-config-presets",
    )
    return Array.isArray(data) ? data : []
  },

  createPreset: async (payload: PlateCameraConfigPresetMutationPayload) => {
    const { data } = await api.post<PlateCameraConfigPreset>(
      "/integrations/plate-camera-config-presets",
      payload,
    )
    return data
  },

  updatePreset: async (id: number, payload: Partial<PlateCameraConfigPresetMutationPayload>) => {
    const { data } = await api.patch<PlateCameraConfigPreset>(
      `/integrations/plate-camera-config-presets/${id}`,
      payload,
    )
    return data
  },

  removePreset: async (id: number) => {
    const { data } = await api.delete(
      `/integrations/plate-camera-config-presets/${id}`,
    )
    return data
  },
}
