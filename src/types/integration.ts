export interface Integration {
  id: number
  code: string
  name: string
  description?: string | null
  enabled: boolean
  driver?: "legacy_pmrj" | "legacy_prf" | "custom_webhook" | string
  editable?: boolean
  environmentTag?: "prod" | "dev" | string
  endpointUrl?: string | null
  httpMethod?: "POST" | "PUT" | "PATCH" | string
  headersTemplate?: string | null
  requestTemplate?: string | null
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

export interface IntegrationMutationPayload {
  code?: string
  name: string
  description?: string
  enabled?: boolean
  environmentTag?: "prod" | "dev"
  endpointUrl?: string
  httpMethod?: "POST" | "PUT" | "PATCH"
  headersTemplate?: string
  requestTemplate?: string
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
  direction?: string | null
  sentAt?: string | null
  createdAt?: string
}

export interface IntegrationLogDetail extends IntegrationLog {
  requestPayload?: string | null
  responsePayload?: string | null
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

export interface PlateCameraCatalogItem {
  path: string
  type: string
  example: string
}

export interface PlateCameraConfig {
  id: number | null
  cameraId: number
  enabled: boolean
  captureNextRequest: boolean
  samplePayload?: string | null
  sampleCatalog: PlateCameraCatalogItem[]
  saveMapping: Record<string, string>
  lastSampledAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  camera?: IntegrationCameraSummary | null
}

export interface PlateCameraConfigPreset {
  id: number
  name: string
  saveMapping: Record<string, string>
  createdAt?: string | null
  updatedAt?: string | null
}

export interface PlateCameraConfigPresetMutationPayload {
  name: string
  saveMapping?: string
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
