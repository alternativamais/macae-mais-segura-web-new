export interface Integration {
  id: number
  code: string
  name: string
  description?: string | null
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type IntegrationDirectionFilter = "ALL" | "OBVERSE" | "REVERSE"

export interface IntegrationCameraLocationPoint {
  id: number
  nome: string
  pontoDeReferencia?: string | null
}

export interface IntegrationCameraLocationTotem {
  id: number
  numero?: string | null
  ponto?: IntegrationCameraLocationPoint | null
}

export interface IntegrationCameraSummary {
  id: number
  nome?: string | null
  ip?: string | null
  status?: string
  ponto?: IntegrationCameraLocationPoint | null
  totem?: IntegrationCameraLocationTotem | null
}

export interface IntegrationTokenSummary {
  id: number
  tokenPreview?: string | null
  token?: string | null
  revoked: boolean
  revokedAt?: string | null
  createdAt?: string
}

export interface IntegrationCameraBinding {
  id: number
  integrationId: number
  cameraId: number
  active: boolean
  codCet?: string | null
  codCetObverse?: string | null
  codCetReverse?: string | null
  directionFilter?: IntegrationDirectionFilter | string | null
  createdAt?: string
  updatedAt?: string
  camera?: IntegrationCameraSummary | null
  tokens?: IntegrationTokenSummary[]
}

export interface IntegrationCameraDetails {
  integration: Integration
  configured: IntegrationCameraBinding[]
  availableCameras: IntegrationCameraSummary[]
}

export interface IntegrationCameraMutationPayload {
  active?: boolean
  codCet?: string
  codCetObverse?: string
  codCetReverse?: string
  directionFilter?: IntegrationDirectionFilter
}

export interface IntegrationLog {
  id: number
  integrationCameraId: number
  plateText: string
  codCet: string
  latitude?: number | null
  longitude?: number | null
  responseStatus?: number | null
  success: boolean
  errorMessage?: string | null
  requestPayload?: string | null
  responsePayload?: string | null
  direction?: string | null
  sentAt?: string | null
  createdAt?: string
}

export interface IntegrationLogsResponse {
  data: IntegrationLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IntegrationGeneratedToken {
  token: string
}

export interface IntegrationRealtimeLogLine {
  time: string
  message: string
  type: "info" | "success" | "error" | "running" | "header" | "warning" | "separator" | "detail"
}

export interface IntegrationRealtimeRawPayload {
  time: string
  cameraId: number
  payload: unknown
}
