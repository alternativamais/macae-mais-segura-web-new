export interface LprFineReportCompany {
  id: number
  nome: string
}

export interface LprFineReportCamera {
  id: number
  nome?: string | null
  ip?: string | null
}

export interface LprFineReportRule {
  id: number
  name: string
  description?: string | null
}

export interface LprFineDispatchLog {
  id: number
  reportId?: number | null
  channel: string
  success: boolean
  subject: string
  toRecipients: string[]
  errorMessage?: string | null
  providerMessageId?: string | null
  sentAt?: string | null
  createdAt?: string
}

export interface LprFineReport {
  id: number
  empresaId: number
  ruleId: number
  detectionId?: number | null
  cameraId: number
  plateText: string
  normalizedPlate: string
  deliveryChannels: string[]
  imageUrl?: string | null
  imageOriginalName?: string | null
  imageMimeType?: string | null
  payloadSnapshot?: Record<string, unknown> | null
  detectionSnapshot?: Record<string, unknown> | null
  triggeredAt: string
  detectedAt?: string | null
  createdAt?: string
  updatedAt?: string
  empresa?: LprFineReportCompany | null
  camera?: LprFineReportCamera | null
  rule?: LprFineReportRule | null
  dispatchLogs?: LprFineDispatchLog[]
}

export interface LprFineReportListResponse {
  data: LprFineReport[]
  total: number
  page: number
  limit: number
}

export interface LprFineReportListParams {
  page?: number
  limit?: number
  search?: string
  empresaId?: number
  cameraId?: number
  ruleId?: number
}
